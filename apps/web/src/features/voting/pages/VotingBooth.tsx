import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { candidateApi } from "../../auth/services/candidate.api";
import { voterApi } from "../../auth/services/voter.api";
import { votesApi } from "../services/votes.api";
//import { useNullifierSecret } from "../../auth/hooks/useNullifierSecret";
import { useVoteProof } from "../hooks/useVoteProof";
//import { uuidToBigInt } from "../../../lib/zk-utils";
import { useAuth } from "../../auth/hooks/useAuth";
import { Card } from "../../../components/m3/Card";
import { Button } from "../../../components/m3/Button";
import { Dialog } from "../../../components/m3/Dialog";
import { Check, AlertTriangle, Loader2, X, Ban } from "lucide-react";
import { encryptWithPublicKey } from "../../../lib/crypto";
import { VOTE_RULES } from '@savote/shared-types';
import { generateZkSecret, calculateCommitment } from "../../../lib/zk";
// ZK Secret Generating Function

import { votersApi } from "../services/voters.api";
import { useRef } from "react";





export const VotingBooth: React.FC = () => {
  const { electionId } = useParams<{ electionId: string }>();
  const navigate = useNavigate();
  //const { secret } = useNullifierSecret();
  const { user } = useAuth();
  const {
    generateProof,
    isLoading: isGeneratingProof,
    error: proofError,
  } = useVoteProof();

  const [secret, setSecret] = useState<string | null>(null);
  const [isRegisteringKey, setIsRegisteringKey] = useState(false);
  const setupDoneRef = useRef(false);
  console.log(isRegisteringKey);

  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(
    null,
  );
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);

  const normalizeToBigIntString = (value: string) => {
    if (!value) return "";
    try {
      const hex = value.startsWith("0x") ? value : "0x" + value;
      return BigInt(hex).toString();
    } catch (e) {
      console.error("Format conversion error:", value);
      return "";
    }
  };
  // 1. Fetch Candidates
  const { data: candidates, isLoading: isLoadingCandidates } = useQuery({
    queryKey: ["candidates", electionId],
    queryFn: () => candidateApi.findAll(electionId!),
    enabled: !!electionId,
  });

  // 2. Check Eligibility
  const {
    data: eligibility,
    isLoading: isLoadingEligibility,
    error: eligibilityError,
  } = useQuery({
    queryKey: ["eligibility", electionId],
    queryFn: () => voterApi.verifyEligibility(electionId!),
    enabled: !!electionId,
    retry: false,
  });
  const election = eligibility?.election;



  // Handle eligibility error redirect
  React.useEffect(() => {
    const studentId = user?.studentIdHash;
    if (!electionId || !studentId || !eligibility || setupDoneRef.current) return;

    const initKeyAndRegister = async () => {

      setupDoneRef.current = true;
      console.log("Step1:進入 initKeyAndRegister", {
        hasEligibility: !!eligibility,
        isRegistered: eligibility?.isRegistered,
        setupDone: setupDoneRef.current
      });

      const storageKey = `savote_secret_${electionId}`;
      let existingSecret = localStorage.getItem(storageKey);



      if (!existingSecret) {
        console.log("產生全新金鑰");
        const newSecret = generateZkSecret();
        existingSecret = normalizeToBigIntString(newSecret);
        localStorage.setItem(storageKey, existingSecret);
      } else {
        console.log("使用既有金鑰");
      }

      // 2. 同步到 React State
      setSecret(existingSecret);

      // 3. 根據後端狀態決定是否要註冊 
      if (!eligibility.isRegistered) {
        try {
          setIsRegisteringKey(true);

          const commitment = await calculateCommitment(studentId, existingSecret);

          console.log("[DEBUG] Registering Commitment:", commitment);
          await votersApi.registerCommitment(electionId, commitment);

          console.log("Success");
        } catch (error) {
          console.error("Failed: ", error);
        } finally {
          setIsRegisteringKey(false);
        }
      }
    };

    initKeyAndRegister();
  }, [electionId, user?.studentIdHash, eligibility]);

  // 3. Submit Vote Mutation
  const submitVoteMutation = useMutation({
    mutationFn: votesApi.submitVote,
    onSuccess: (data) => {
      navigate("/vote/success", { state: { receipt: data } });
    },
  });

  const handleVote = async () => {
    setIsConfirmDialogOpen(false);

    // Check if election.publicKey exists
    if (
      !electionId ||
      !election?.publicKey ||
      !secret ||
      !user?.studentIdHash
    ) {
      console.error("Missing required voting parameters or public key");
      return;
    }

    const finalVoteValue = selectedCandidate || VOTE_RULES.BLANK_VOTE;

    try {
      const studentIdStr = normalizeToBigIntString(user.studentIdHash);
      const secretStr = normalizeToBigIntString(secret);

      const testCommitment = await calculateCommitment(user.studentIdHash, secret);
      console.log("[TEST] Commitment:", testCommitment);

      const input = {
        studentId: studentIdStr,
        secret: secretStr,
      };

      console.log("Step: Generating Proof with inputs", { studentIdStr });
      const { proof, publicSignals } = await generateProof(input);

      if (testCommitment !== publicSignals[0]) {
        console.error("WARNING: NO CORRESPOND");
      }

      // Encrypt the selected candidate using the election's public key
      const encryptedVoteContent = await encryptWithPublicKey(
        finalVoteValue,
        election.publicKey
      );

      // Submit the encrypted vote
      await submitVoteMutation.mutateAsync({
        electionId,
        voteContent: encryptedVoteContent,
        encryptKey: "RSA-OAEP", // Or any identifier your backend expects, or remove if not needed
        proof,
        publicSignals,
      });
    } catch (err) {
      console.error("Voting failed:", err);
    }
  };



  const selectedCandidateData = candidates?.find(
    (c) => c.id === selectedCandidate,
  );

  if (isLoadingCandidates || isLoadingEligibility || isRegisteringKey) {
    return (
      <div className="min-h-[60vh] flex flex-col justify-center items-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-[var(--color-primary)]" />
        <p className="text-[var(--color-on-surface-variant)]">
          {isRegisteringKey ? "正在初始化投票資格..." : "載入中..."}
        </p>
      </div>
    );
  }

  if (eligibilityError || (eligibility && (!eligibility.eligible || eligibility.hasVoted))) {

    // 動態決定標題與內文
    const isAlreadyVoted = eligibility?.hasVoted;
    const title = isAlreadyVoted ? "已完成投票" : "無法投票";
    const message = isAlreadyVoted
      ? "您已經成功投過票，無法重複提交選票。"
      : (eligibility?.reason || "您不符合此次選舉的投票資格。");

    return (
      <div className="min-h-[60vh] flex justify-center items-center p-4">
        <Card className="max-w-md w-full text-center p-8 flex flex-col items-center gap-4">
          <div className="p-4 rounded-full bg-[var(--color-error-container)] text-[var(--color-on-error-container)]">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-[var(--color-on-surface)]">
            {title}
          </h2>
          <p className="text-[var(--color-on-surface-variant)]">
            {message}
          </p>
          <Button onClick={() => navigate("/")} variant="outlined">
            返回首頁
          </Button>
        </Card>
      </div>
    );
  };


  return (
    <div className="space-y-8 animate-fade-in pb-24">
      {/* Page Title */}
      <div className="text-center md:text-left space-y-2">
        <h1 className="text-3xl md:text-4xl font-normal text-[var(--color-on-background)]">
          投票所
        </h1>
        <p className="text-[var(--color-on-surface-variant)]">
          請在下方選擇一位候選人。
        </p>
      </div>

      {/* Candidate Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {candidates?.map((candidate) => (
          <Card
            key={candidate.id}
            interactive
            variant={selectedCandidate === candidate.id ? "filled" : "outlined"}
            className={`relative overflow-hidden transition-all duration-300 group ${selectedCandidate === candidate.id
              ? "bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] border-[var(--color-primary)] ring-2 ring-[var(--color-primary)]"
              : "hover:bg-[var(--color-surface-variant)]/30"
              }`}
            onClick={() => {
              setSelectedCandidate((prev) => (prev === candidate.id ? null : candidate.id));
            }}
          >
            <div className="aspect-video bg-[var(--color-surface-variant)] relative overflow-hidden">
              {/* Photo Placeholder */}
              {candidate.photoUrl ? (
                <img
                  src={candidate.photoUrl}
                  alt={candidate.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[var(--color-primary)] opacity-50">
                  <svg
                    className="w-20 h-20"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}

              {/* Selected Checkmark Overlay */}
              {selectedCandidate === candidate.id && (
                <div className="absolute inset-0 bg-[var(--color-primary)]/20 flex items-center justify-center backdrop-blur-[1px] animate-fade-in">
                  <div className="bg-[var(--color-primary)] text-[var(--color-on-primary)] rounded-full p-3 shadow-lg transform scale-100 animate-scale-in">
                    <Check className="w-8 h-8" strokeWidth={3} />
                  </div>
                </div>
              )}
            </div>

            <div className="p-6">
              <h3 className="text-2xl font-bold mb-2">{candidate.name}</h3>
              <p className="text-sm opacity-80 line-clamp-3">{candidate.bio}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Floating Action Button / Sticky Footer */}
      <div className="fixed bottom-20 md:bottom-8 right-4 md:right-8 z-30 pointer-events-none flex justify-center w-full md:w-auto md:block">
        <div className="pointer-events-auto shadow-xl rounded-full">
          <Button
            variant="fab"
            disabled={
              isGeneratingProof ||
              submitVoteMutation.isPending
            }
            onClick={() => setIsConfirmDialogOpen(true)}
            className="w-full md:w-auto px-8 h-14 md:h-16 text-lg gap-3"
            icon={
              isGeneratingProof || submitVoteMutation.isPending ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Check />
              )
            }
          >
            <span className="font-bold">
              {isGeneratingProof
                ? "正在產生證明..."
                : submitVoteMutation.isPending
                  ? "正在送出選票..."
                  : "確認投票"}
            </span>
          </Button>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog
        open={isConfirmDialogOpen}
        onClose={() => setIsConfirmDialogOpen(false)}
        title={selectedCandidate ? "確認您的選票" : "確認投下廢票"}
        description={
          selectedCandidate
            ? "您確定要投給這位候選人嗎？此操作送出後將無法撤回。"
            : "您目前尚未圈選任何候選人。若繼續送出，將被計為「廢票」。確定要投下廢票嗎？"
        }
        icon={<AlertTriangle className="w-8 h-8" />}
        actions={
          <>
            <Button
              variant="text"
              onClick={() => setIsConfirmDialogOpen(false)}
            >
              返回修改
            </Button>
            <Button
              onClick={handleVote}
              loading={isGeneratingProof || submitVoteMutation.isPending}
              // Add a red styling if it's a blank vote warning
              className={!selectedCandidate ? "bg-[var(--color-error)] text-[var(--color-on-error)]" : ""}
            >
              {selectedCandidate ? "送出選票" : "確認投下廢票"}
            </Button>
          </>
        }
      >
        {selectedCandidateData ? (
          <div className="p-4 bg-[var(--color-surface-variant)] rounded-lg flex items-center gap-4 mt-2">
            <div className="w-12 h-12 bg-[var(--color-primary)] rounded-full flex items-center justify-center text-[var(--color-on-primary)] font-bold text-xl">
              {selectedCandidateData.name.charAt(0)}
            </div>
            <div>
              <div className="text-xs text-[var(--color-on-surface-variant)]">
                您選擇的是：
              </div>
              <div className="text-lg font-bold text-[var(--color-on-surface)]">
                {selectedCandidateData.name}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-[var(--color-error-container)]/30 rounded-lg flex items-center gap-4 mt-2 border border-[var(--color-error)]/30">
            <div className="w-12 h-12 bg-[var(--color-surface-container-high)] rounded-full flex items-center justify-center text-[var(--color-on-surface-variant)]">
              <Ban className="w-6 h-6" />
            </div>
            <div>
              <div className="text-lg font-bold text-[var(--color-error)]">
                均不圈選 (將計為廢票)
              </div>
            </div>
          </div>
        )}
      </Dialog>

      {/* Errors */}
      {(proofError || submitVoteMutation.error) && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-[var(--color-error-container)] text-[var(--color-on-error-container)] px-6 py-4 rounded-xl shadow-lg z-50 flex items-center gap-3 animate-slide-up max-w-[90vw]">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <div>
            <div className="font-bold">發生錯誤</div>
            <div className="text-sm">
              {proofError || (submitVoteMutation.error as any)?.message}
            </div>
          </div>
          <Button
            variant="text"
            color="error"
            className="min-w-0 p-2 h-auto ml-2"
            onClick={() => {
              /* clear error? */
            }}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
};
