import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { tournamentsAPI } from "../api";
import toast from "react-hot-toast";

export const useTournaments = (params?: any) =>
  useQuery({
    queryKey: ["tournaments", params],
    queryFn: () => tournamentsAPI.list(params).then((r) => r.data.tournaments),
    staleTime: 30000,
  });

export const useTournament = (id?: string) =>
  useQuery({
    queryKey: ["tournament", id],
    queryFn: () =>
      tournamentsAPI
        .get(id!)
        .then((r) => ({
          tournament: r.data.tournament,
          players: r.data.players,
        })),
    enabled: !!id,
    refetchInterval: 15000,
  });

export const useTournamentStandings = (id?: string) =>
  useQuery({
    queryKey: ["tournament-standings", id],
    queryFn: () => tournamentsAPI.standings(id!).then((r) => r.data.standings),
    enabled: !!id,
    refetchInterval: 10000,
  });

export const useTournamentPairings = (id?: string, round?: number) =>
  useQuery({
    queryKey: ["tournament-pairings", id, round],
    queryFn: () => tournamentsAPI.pairings(id!, round).then((r) => r.data),
    enabled: !!id,
    refetchInterval: 10000,
  });

export const useCreateTournament = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => tournamentsAPI.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tournaments"] });
      toast.success("Tournament created!");
    },
    onError: (e: any) =>
      toast.error(e.response?.data?.message || "Failed to create"),
  });
};

export const useUpdateTournament = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      tournamentsAPI.update(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ["tournament", id] });
      toast.success("Tournament updated");
    },
    onError: (e: any) => toast.error(e.response?.data?.message || "Failed"),
  });
};

export const useStartTournament = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tournamentsAPI.start(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ["tournament", id] });
      qc.invalidateQueries({ queryKey: ["tournament-pairings", id] });
      toast.success("Tournament started! Round 1 pairings generated.");
    },
    onError: (e: any) =>
      toast.error(e.response?.data?.message || "Failed to start"),
  });
};

export const useNextRound = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tournamentsAPI.nextRound(id),
    onSuccess: (data: any, id) => {
      qc.invalidateQueries({ queryKey: ["tournament", id] });
      qc.invalidateQueries({ queryKey: ["tournament-pairings", id] });
      qc.invalidateQueries({ queryKey: ["tournament-standings", id] });
      const msg = data.data?.completed
        ? "Tournament completed! 🏆"
        : `Round ${data.data?.round} pairings ready!`;
      toast.success(msg);
    },
    onError: (e: any) => toast.error(e.response?.data?.message || "Failed"),
  });
};

export const useSetMatchResult = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      tournamentId,
      matchId,
      result,
    }: {
      tournamentId: string;
      matchId: string;
      result: string;
    }) => tournamentsAPI.setResult(tournamentId, matchId, result),
    onSuccess: (_, { tournamentId }) => {
      qc.invalidateQueries({ queryKey: ["tournament-pairings", tournamentId] });
      qc.invalidateQueries({
        queryKey: ["tournament-standings", tournamentId],
      });
      toast.success("Result recorded");
    },
    onError: (e: any) =>
      toast.error(e.response?.data?.message || "Failed to record result"),
  });
};

export const useRegisterTournament = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tournamentsAPI.register(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ["tournaments"] });
      qc.invalidateQueries({ queryKey: ["tournament", id] });
      toast.success("Registered successfully!");
    },
    onError: (e: any) =>
      toast.error(e.response?.data?.message || "Registration failed"),
  });
};

export const useUnregisterTournament = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tournamentsAPI.unregister(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ["tournaments"] });
      qc.invalidateQueries({ queryKey: ["tournament", id] });
      toast.success("Withdrawn from tournament");
    },
    onError: () => toast.error("Failed to withdraw"),
  });
};

export const useCancelTournament = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tournamentsAPI.cancel(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tournaments"] });
      toast.success("Tournament cancelled");
    },
    onError: () => toast.error("Failed"),
  });
};
