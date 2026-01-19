import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { candidateApi } from "../../auth/services/candidate.api";
import { voterApi } from "../../auth/services/voter.api";
import { votesApi } from "../services/votes.api";
import { useNullifierSecret } from "../../auth/hooks/useNullifierSecret";
import { useVoteProof } from "../hooks/useVoteProof";
import { uuidToBigInt } from "../../../lib/zk-utils";
import { useAuth } from "../../auth/hooks/useAuth";
import { Card } from "../../../components/m3/Card";
import { Button } from "../../../components/m3/Button";
import { Dialog } from "../../../components/m3/Dialog";
import { Check, AlertTriangle, Loader2 } from "lucide-react";

export const VotingBooth: React.FC = () => {
  const { t } = useTranslation();
  const { electionId } = useParams<{ electionId: string }>();
  const navigate = useNavigate();
  const { secret } = useNullifierSecret();
  const { user } = useAuth();
  const {
    generateProof,
    isLoading: isGeneratingProof,
    error: proofError,
  } = useVoteProof();
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);

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

  // Handle eligibility error redirect
  React.useEffect(() => {
    if (eligibilityError && (eligibilityError as any)?.response?.data === 'COMMITMENT_NOT_REGISTERED' && electionId) {
      navigate(`/elections/${electionId}/setup-key`);
    }
  }, [eligibilityError, electionId, navigate]);

  // 3. Submit Vote Mutation
  const submitVoteMutation = useMutation({
    mutationFn: votesApi.submitVote,
    onSuccess: (data) => {
      navigate("/vote/success", { state: { receipt: data } });
    },
  });

  const handleVote = async () => {
    setIsConfirmDialogOpen(false); // Close dialog

    if (!electionId || !selectedCandidate || !secret || !eligibility || !user?.studentIdHash) {
        if (!user?.studentIdHash) console.error("Missing studentIdHash");
        return;
    }

    try {
      // Prepare Inputs
      const electionIdBigInt = uuidToBigInt(electionId);
      const voteBigInt = uuidToBigInt(selectedCandidate);
      // Ensure secret is properly formatted as hex
      const secretHex = secret.startsWith('0x') ? secret : '0x' + secret;
      const secretBigInt = BigInt(secretHex);
      
      const studentIdHex = user.studentIdHash.startsWith('0x') ? user.studentIdHash : '0x' + user.studentIdHash;
      const studentIdBigInt = BigInt(studentIdHex);

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
        studentIdHash: studentIdBigInt.toString(),
        pathIndices,
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

  const selectedCandidateData = candidates?.find(c => c.id === selectedCandidate);

  if (isLoadingCandidates || isLoadingEligibility) {
    return (
      <div className="min-h-[60vh] flex justify-center items-center">
         <Loader2 className="h-12 w-12 animate-spin text-[var(--color-primary)]" />
      </div>
    );
  }

  if (eligibilityError || (eligibility && !eligibility.eligible)) {
    return (
      <div className="min-h-[60vh] flex justify-center items-center p-4">
        <Card className="max-w-md w-full text-center p-8 flex flex-col items-center gap-4">
          <div className="p-4 rounded-full bg-[var(--color-error-container)] text-[var(--color-on-error-container)]">
             <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-[var(--color-on-surface)]">{t('vote.ineligible_title', 'Unable to Vote')}</h2>
          <p className="text-[var(--color-on-surface-variant)]">
            {eligibility?.reason || t('vote.ineligible_msg', 'You are not eligible to vote in this election.')}
          </p>
          <Button onClick={() => navigate('/')} variant="outlined">
            {t('common.back_home', 'Back to Home')}
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-24">
      {/* Page Title */}
      <div className="text-center md:text-left space-y-2">
           <h1 className="text-3xl md:text-4xl font-normal text-[var(--color-on-background)]">{t('vote.booth_title', 'Voting Booth')}</h1>
           <p className="text-[var(--color-on-surface-variant)]">{t('vote.select_candidate', 'Please select one candidate below.')}</p>
      </div>

      {/* Candidate Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {candidates?.map((candidate) => (
            <Card
              key={candidate.id}
              interactive
              variant={selectedCandidate === candidate.id ? 'filled' : 'outlined'}
              className={`relative overflow-hidden transition-all duration-300 group ${
                selectedCandidate === candidate.id
                  ? "bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] border-[var(--color-primary)] ring-2 ring-[var(--color-primary)]"
                  : "hover:bg-[var(--color-surface-variant)]/30"
              }`}
              onClick={() => setSelectedCandidate(candidate.id)}
            >
              <div className="aspect-video bg-[var(--color-surface-variant)] relative overflow-hidden">
                 {/* Photo Placeholder */}
                 {candidate.photoUrl ? (
                    <img src={candidate.photoUrl} alt={candidate.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                 ) : (
                    <div className="w-full h-full flex items-center justify-center text-[var(--color-primary)] opacity-50">
                        <svg className="w-20 h-20" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
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
                    disabled={!selectedCandidate || isGeneratingProof || submitVoteMutation.isPending}
                    onClick={() => setIsConfirmDialogOpen(true)}
                    className="w-full md:w-auto px-8 h-14 md:h-16 text-lg gap-3"
                    icon={isGeneratingProof || submitVoteMutation.isPending ? <Loader2 className="animate-spin" /> : <Check />}
               >
                   <span className="font-bold">
                       {isGeneratingProof ? t('vote.generating_proof', 'Generating Proof...') : 
                        submitVoteMutation.isPending ? t('vote.submitting', 'Submitting...') : 
                        t('vote.confirm_choice', 'Confirm Vote')}
                   </span>
               </Button>
           </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog 
        open={isConfirmDialogOpen} 
        onClose={() => setIsConfirmDialogOpen(false)}
        title={t('vote.confirm_dialog_title', 'Confirm Your Vote')}
        description={t('vote.confirm_dialog_desc', 'Are you sure you want to vote for this candidate? This action cannot be undone.')}
        icon={<AlertTriangle className="w-8 h-8" />}
        actions={
            <>
                <Button variant="text" onClick={() => setIsConfirmDialogOpen(false)}>
                    {t('common.cancel', 'Cancel')}
                </Button>
                <Button onClick={handleVote} loading={isGeneratingProof || submitVoteMutation.isPending}>
                    {t('vote.submit_vote', 'Submit Vote')}
                </Button>
            </>
        }
      >
          {selectedCandidateData && (
              <div className="p-4 bg-[var(--color-surface-variant)] rounded-lg flex items-center gap-4 mt-2">
                  <div className="w-12 h-12 bg-[var(--color-primary)] rounded-full flex items-center justify-center text-[var(--color-on-primary)] font-bold text-xl">
                      {selectedCandidateData.name.charAt(0)}
                  </div>
                  <div>
                      <div className="text-xs text-[var(--color-on-surface-variant)]">{t('vote.you_selected', 'You selected:')}</div>
                      <div className="text-lg font-bold text-[var(--color-on-surface)]">{selectedCandidateData.name}</div>
                  </div>
              </div>
          )}
      </Dialog>
      
      {/* Errors */}
      {(proofError || submitVoteMutation.error) && (
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-[var(--color-error-container)] text-[var(--color-on-error-container)] px-6 py-4 rounded-xl shadow-lg z-50 flex items-center gap-3 animate-slide-up max-w-[90vw]">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <div>
                  <div className="font-bold">{t('common.error', 'Error occurred')}</div>
                  <div className="text-sm">
                      {proofError || (submitVoteMutation.error as any)?.message}
                  </div>
              </div>
              <Button variant="text" color="error" className="min-w-0 p-2 h-auto ml-2" onClick={() => { /* clear error? */ }}>
                  <X className="w-4 h-4" />
              </Button>
          </div>
      )}
    </div>
  );
};

// Helper for Close icon
import { X } from 'lucide-react';
