import React, { useState } from "react";
import { PageShell } from "../../../components/layout/PageShell";
import { GlassCard } from "../../../components/ui/GlassCard";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { candidateApi } from "../../auth/services/candidate.api";
import { voterApi } from "../../auth/services/voter.api";
import { votesApi } from "../services/votes.api";
import { useNullifierSecret } from "../../auth/hooks/useNullifierSecret";
import { useVoteProof } from "../hooks/useVoteProof";
import { uuidToBigInt } from "../../../lib/zk-utils";

export const VotingBooth: React.FC = () => {
  const { electionId } = useParams<{ electionId: string }>();
  const navigate = useNavigate();
  const { secret } = useNullifierSecret();
  const {
    generateProof,
    isLoading: isGeneratingProof,
    error: proofError,
  } = useVoteProof();
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(
    null
  );

  // 1. Fetch Candidates
  const { data: candidates, isLoading: isLoadingCandidates } = useQuery({
    queryKey: ["candidates", electionId],
    queryFn: () => candidateApi.findAll(electionId!),
    enabled: !!electionId,
  });

  // 2. Check Eligibility & Get Merkle Path
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

  // 3. Submit Vote Mutation
  const submitVoteMutation = useMutation({
    mutationFn: votesApi.submitVote,
    onSuccess: (data) => {
      navigate("/vote/success", { state: { receipt: data } });
    },
  });

  const handleVote = async () => {
    if (!electionId || !selectedCandidate || !secret || !eligibility) return;

    try {
      // Prepare Inputs
      const electionIdBigInt = uuidToBigInt(electionId);
      const voteBigInt = uuidToBigInt(selectedCandidate);
      // Ensure secret is properly formatted as hex
      const secretHex = secret.startsWith('0x') ? secret : '0x' + secret;
      const secretBigInt = BigInt(secretHex);

      // Merkle Path
      const { merkleRootHash, merkleProof, leafIndex } = eligibility;
      if (!merkleRootHash || leafIndex === undefined) {
        throw new Error("Invalid eligibility data");
      }

      // Convert leafIndex to pathIndices (binary array, LSB first)
      // Depth 20
      const pathIndices = leafIndex
        .toString(2)
        .padStart(20, "0")
        .split("")
        .reverse()
        .map(Number);

      const input = {
        root: merkleRootHash,
        electionId: electionIdBigInt.toString(),
        vote: voteBigInt.toString(),
        secret: secretBigInt.toString(),
        pathIndices: pathIndices,
        siblings: merkleProof,
      };

      // Generate Proof
      const { proof, publicSignals } = await generateProof(input);

      // Submit Vote
      await submitVoteMutation.mutateAsync({
        electionId,
        vote: selectedCandidate,
        proof,
        publicSignals,
      });
    } catch (err) {
      console.error("Voting failed:", err);
    }
  };

  if (isLoadingCandidates || isLoadingEligibility) {
    return (
      <PageShell>
        <div className="min-h-[60vh] flex justify-center items-center">
          <div className="spinner h-12 w-12" />
        </div>
      </PageShell>
    );
  }

  if (eligibilityError || (eligibility && !eligibility.eligible)) {
    return (
      <PageShell>
        <div className="min-h-[60vh] flex justify-center items-center p-4">
          <GlassCard>
            <div className="max-w-md w-full text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-500/20 mb-4">
                <svg className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">無法投票</h2>
              <p className="text-gray-300 mb-6">
                {eligibility?.reason || "您不具備此選舉的投票資格。"}
              </p>
              <Link to="/" className="inline-flex justify-center w-full px-4 py-2 text-sm font-medium rounded-md text-white glass-strong border border-blue-400/50 hover:border-blue-400/80 hover:bg-blue-500/20 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-blue-500/30 backdrop-blur-xl">
                返回首頁
              </Link>
            </div>
          </GlassCard>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      {/* Header */}
      <header className="glass sticky top-0 z-40 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center">
            <Link to="/" className="text-blue-200 hover:text-white mr-4">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <h1 className="text-xl font-bold text-white">投票所</h1>
          </div>
          <div className="text-sm text-gray-300">
            請選擇一位候選人
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-fade-in">
          {candidates?.map((candidate) => (
            <GlassCard
              key={candidate.id}
              className={`relative overflow-hidden cursor-pointer group transition-all ${
                selectedCandidate === candidate.id
                  ? "ring-2 ring-blue-500 glow-blue-border -translate-y-1"
                  : "hover:glow-blue-border hover:-translate-y-1"
              }`}
              onClick={() => setSelectedCandidate(candidate.id)}
            >
              <div className="bg-white/5 rounded-xl overflow-hidden">
                {candidate.photoUrl ? (
                  <img
                    src={candidate.photoUrl}
                    alt={candidate.name}
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <div className="w-full h-48 flex items-center justify-center bg-blue-500/10 text-blue-200">
                    <svg className="w-20 h-20" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
                {selectedCandidate === candidate.id && (
                  <div className="absolute inset-0 bg-blue-500/10 flex items-center justify-center">
                    <div className="bg-white/90 rounded-full p-2 shadow-lg">
                      <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-white mb-2">{candidate.name}</h3>
                <p className="text-gray-300 text-sm leading-relaxed line-clamp-3">{candidate.bio}</p>
              </div>
            </GlassCard>
          ))}
        </div>
      </main>

      {/* Sticky Footer */}
      <div className="fixed bottom-0 left-0 right-0 glass border-t border-white/10 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="hidden sm:block">
            <p className="text-sm text-gray-300">
              {selectedCandidate
                ? "已選擇候選人，請確認後送出選票。"
                : "請點擊上方卡片選擇您支持的候選人。"}
            </p>
          </div>

          <button
            onClick={handleVote}
            disabled={
              !selectedCandidate ||
              isGeneratingProof ||
              submitVoteMutation.isPending
            }
            className={`w-full sm:w-auto px-8 py-3 rounded-lg font-bold text-white transition-all duration-200 flex items-center justify-center ${
              !selectedCandidate ||
              isGeneratingProof ||
              submitVoteMutation.isPending
                ? "bg-gray-500/40 cursor-not-allowed"
                : "glass-strong border border-blue-400/50 hover:border-blue-400/80 hover:bg-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 backdrop-blur-xl active:scale-95"
            }`}
          >
            {isGeneratingProof ? (
              <>
                <svg className="spinner -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                </svg>
                生成零知識證明中...
              </>
            ) : submitVoteMutation.isPending ? (
              <>
                <svg className="spinner -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                </svg>
                提交選票中...
              </>
            ) : (
              "確認投票"
            )}
          </button>
        </div>
      </div>

      {proofError && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 glass-subtle border border-red-400/30 text-red-300 px-4 py-3 rounded shadow-lg z-50">
          <strong className="font-bold">錯誤：</strong>
          <span className="block sm:inline"> 生成證明失敗：{proofError}</span>
        </div>
      )}

      {submitVoteMutation.error && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 glass-subtle border border-red-400/30 text-red-300 px-4 py-3 rounded shadow-lg z-50">
          <strong className="font-bold">錯誤：</strong>
          <span className="block sm:inline"> 提交失敗：{submitVoteMutation.error.message}</span>
        </div>
      )}
    </PageShell>
  );
};
