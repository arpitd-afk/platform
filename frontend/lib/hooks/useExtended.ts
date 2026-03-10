import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { extUsersAPI, contentExtAPI, billingExtAPI } from "../api";
import toast from "react-hot-toast";

export const useRatingHistory = (id?: string, limit = 30) =>
  useQuery({
    queryKey: ["rating-history", id, limit],
    queryFn: () =>
      extUsersAPI.ratingHistory(id!, limit).then((r) => r.data.history),
    enabled: !!id,
    staleTime: 60000,
  });

export const useMyChildren = () =>
  useQuery({
    queryKey: ["my-children"],
    queryFn: () => extUsersAPI.myChildren().then((r) => r.data.children),
    staleTime: 30000,
  });

export const useStudentAttendance = (id?: string) =>
  useQuery({
    queryKey: ["attendance", id],
    queryFn: () => extUsersAPI.attendance(id!).then((r) => r.data.attendance),
    enabled: !!id,
    staleTime: 30000,
  });

export const useLeaderboard = (academyId?: string) =>
  useQuery({
    queryKey: ["leaderboard", academyId],
    queryFn: () =>
      extUsersAPI.leaderboard(academyId!).then((r) => r.data.leaderboard),
    enabled: !!academyId,
    staleTime: 60000,
  });

export const useChildrenProgress = (parentId?: string) =>
  useQuery({
    queryKey: ["children-progress", parentId],
    queryFn: () =>
      extUsersAPI.childrenProgress(parentId!).then((r) => r.data.progress),
    enabled: !!parentId,
    staleTime: 30000,
  });

export const useLessons = (params?: any) =>
  useQuery({
    queryKey: ["lessons", params],
    queryFn: () => contentExtAPI.lessons(params).then((r) => r.data.lessons),
    staleTime: 60000,
  });

export const useMyLessonProgress = () =>
  useQuery({
    queryKey: ["lesson-progress"],
    queryFn: () => contentExtAPI.myProgress().then((r) => r.data.progress),
    staleTime: 30000,
  });

export const useCompleteLesson = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => contentExtAPI.completeLesson(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lesson-progress"] });
      qc.invalidateQueries({ queryKey: ["lessons"] });
      toast.success("Lesson marked as complete!");
    },
  });
};

export const useMyLessons = (params?: any) =>
  useQuery({
    queryKey: ["my-lessons", params],
    queryFn: () => contentExtAPI.myLessons(params).then((r) => r.data.lessons),
    staleTime: 30000,
  });

export const useLesson = (id?: string) =>
  useQuery({
    queryKey: ["lesson", id],
    queryFn: () => contentExtAPI.getLesson(id!).then((r) => r.data),
    enabled: !!id,
  });

export const useCreateLesson = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => contentExtAPI.createLesson(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-lessons"] });
      qc.invalidateQueries({ queryKey: ["lessons"] });
      toast.success("Lesson created!");
    },
    onError: (e: any) =>
      toast.error(e.response?.data?.message || "Failed to create"),
  });
};

export const useUpdateLesson = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      contentExtAPI.updateLesson(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ["my-lessons"] });
      qc.invalidateQueries({ queryKey: ["lessons"] });
      qc.invalidateQueries({ queryKey: ["lesson", id] });
      toast.success("Lesson saved!");
    },
    onError: (e: any) =>
      toast.error(e.response?.data?.message || "Failed to update"),
  });
};

export const usePublishLesson = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, publish }: { id: string; publish: boolean }) =>
      contentExtAPI.publishLesson(id, publish),
    onSuccess: (_, { publish }) => {
      qc.invalidateQueries({ queryKey: ["my-lessons"] });
      qc.invalidateQueries({ queryKey: ["lessons"] });
      toast.success(
        publish
          ? "Lesson published — students can now see it"
          : "Lesson unpublished",
      );
    },
    onError: () => toast.error("Failed"),
  });
};

export const useDeleteLesson = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => contentExtAPI.deleteLesson(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-lessons"] });
      qc.invalidateQueries({ queryKey: ["lessons"] });
      toast.success("Lesson deleted");
    },
    onError: () => toast.error("Failed to delete"),
  });
};

export const useCourses = (params?: any) =>
  useQuery({
    queryKey: ["courses", params],
    queryFn: () => contentExtAPI.courses(params).then((r) => r.data.courses),
    staleTime: 60000,
  });

export const useMyInvoices = () =>
  useQuery({
    queryKey: ["my-invoices"],
    queryFn: () => billingExtAPI.myInvoices().then((r) => r.data.invoices),
    staleTime: 60000,
  });

export const useSubscription = (academyId?: string) =>
  useQuery({
    queryKey: ["subscription", academyId],
    queryFn: () =>
      billingExtAPI.subscription(academyId!).then((r) => r.data.subscription),
    enabled: !!academyId,
    staleTime: 60000,
  });
