import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { announcementsAPI } from "../api";
import toast from "react-hot-toast";

export const useAnnouncements = (params?: any) =>
  useQuery({
    queryKey: ["announcements", params],
    queryFn: () =>
      announcementsAPI.list(params).then((r) => r.data.announcements),
    staleTime: 30000,
  });

export const useAllAnnouncements = () =>
  useQuery({
    queryKey: ["announcements-all"],
    queryFn: () => announcementsAPI.listAll().then((r) => r.data.announcements),
    staleTime: 30000,
  });

export const useCreateAnnouncement = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => announcementsAPI.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["announcements"] });
      qc.invalidateQueries({ queryKey: ["announcements-all"] });
      toast.success("Announcement posted!");
    },
    onError: (e: any) =>
      toast.error(e.response?.data?.message || "Failed to post"),
  });
};

export const useUpdateAnnouncement = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      announcementsAPI.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["announcements"] });
      qc.invalidateQueries({ queryKey: ["announcements-all"] });
      toast.success("Announcement updated");
    },
  });
};

export const useDeleteAnnouncement = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => announcementsAPI.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["announcements"] });
      qc.invalidateQueries({ queryKey: ["announcements-all"] });
      toast.success("Announcement deleted");
    },
  });
};

export const usePinAnnouncement = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, pinned }: { id: string; pinned: boolean }) =>
      announcementsAPI.pin(id, pinned),
    onSuccess: (_, { pinned }) => {
      qc.invalidateQueries({ queryKey: ["announcements"] });
      qc.invalidateQueries({ queryKey: ["announcements-all"] });
      toast.success(pinned ? "Pinned to top" : "Unpinned");
    },
  });
};
