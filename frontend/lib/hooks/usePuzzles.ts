import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { puzzlesAPI } from "../api";
import toast from "react-hot-toast";

// ─── Lichess puzzles ──────────────────────────────────────────
export const useDailyPuzzle = () =>
  useQuery({
    queryKey: ["puzzle-daily"],
    queryFn: () => puzzlesAPI.daily().then((r) => r.data.puzzle),
    staleTime: 3600000,
  });

export const useRandomPuzzle = (difficulty?: string) =>
  useQuery({
    queryKey: ["puzzle-random", difficulty],
    queryFn: () => puzzlesAPI.random({ difficulty }).then((r) => r.data.puzzle),
    staleTime: 0,
  });

export const useSubmitPuzzle = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      moves,
      timeTakenMs,
    }: {
      id: string;
      moves: string[];
      timeTakenMs: number;
    }) => puzzlesAPI.submit(id, { moves, timeTakenMs }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["leaderboard"] }),
  });
};

// ─── Leaderboard ──────────────────────────────────────────────
export const usePuzzleLeaderboard = (academyId?: string) =>
  useQuery({
    queryKey: ["puzzle-leaderboard", academyId],
    queryFn: () => puzzlesAPI.leaderboard({ academyId }).then((r) => r.data),
    enabled: !!academyId,
    staleTime: 30000,
  });

export const useMyPuzzleRank = () =>
  useQuery({
    queryKey: ["my-puzzle-rank"],
    queryFn: () => puzzlesAPI.myRank().then((r) => r.data.rank),
    staleTime: 30000,
  });

// ─── Custom puzzles ───────────────────────────────────────────
export const useCustomPuzzles = (params?: any) =>
  useQuery({
    queryKey: ["custom-puzzles", params],
    queryFn: () => puzzlesAPI.customList(params).then((r) => r.data.puzzles),
    staleTime: 30000,
  });

export const useCreateCustomPuzzle = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => puzzlesAPI.customCreate(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["custom-puzzles"] });
      toast.success("Puzzle created!");
    },
    onError: (e: any) => toast.error(e.response?.data?.message || "Failed"),
  });
};

export const useUpdateCustomPuzzle = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      puzzlesAPI.customUpdate(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["custom-puzzles"] });
      toast.success("Puzzle updated!");
    },
  });
};

export const useDeleteCustomPuzzle = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => puzzlesAPI.customDelete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["custom-puzzles"] });
      toast.success("Deleted");
    },
  });
};

export const useSubmitCustomPuzzle = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      moves,
      timeTakenMs,
    }: {
      id: string;
      moves: string[];
      timeTakenMs: number;
    }) => puzzlesAPI.customSubmit(id, { moves, timeTakenMs }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["puzzle-leaderboard"] });
      qc.invalidateQueries({ queryKey: ["my-puzzle-rank"] });
      qc.invalidateQueries({ queryKey: ["custom-puzzles"] });
    },
  });
};

// ─── MCQ ──────────────────────────────────────────────────────
export const useMcqQuestions = (params?: any) =>
  useQuery({
    queryKey: ["mcq-questions", params],
    queryFn: () => puzzlesAPI.mcqList(params).then((r) => r.data.questions),
    staleTime: 30000,
  });

export const useCreateMcq = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => puzzlesAPI.mcqCreate(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mcq-questions"] });
      toast.success("Question created!");
    },
    onError: (e: any) => toast.error(e.response?.data?.message || "Failed"),
  });
};

export const useUpdateMcq = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      puzzlesAPI.mcqUpdate(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mcq-questions"] });
      toast.success("Question updated!");
    },
  });
};

export const useDeleteMcq = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => puzzlesAPI.mcqDelete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mcq-questions"] });
      toast.success("Deleted");
    },
  });
};

export const useSubmitMcq = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      selectedOptionIds,
      timeTakenMs,
    }: {
      id: string;
      selectedOptionIds: string[];
      timeTakenMs: number;
    }) => puzzlesAPI.mcqSubmit(id, { selectedOptionIds, timeTakenMs }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["puzzle-leaderboard"] });
      qc.invalidateQueries({ queryKey: ["my-puzzle-rank"] });
      qc.invalidateQueries({ queryKey: ["mcq-questions"] });
    },
  });
};
