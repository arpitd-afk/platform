import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { assignmentsAPI } from "../api";
import toast from "react-hot-toast";

export const useAssignments = (params?: any) =>
  useQuery({
    queryKey: ["assignments", params],
    queryFn: () => assignmentsAPI.list(params).then((r) => r.data.assignments),
    staleTime: 30000,
  });

export const useAssignment = (id?: string) =>
  useQuery({
    queryKey: ["assignment", id],
    queryFn: () => assignmentsAPI.get(id!).then((r) => r.data),
    enabled: !!id,
  });

export const useAssignmentSubmissions = (id?: string) =>
  useQuery({
    queryKey: ["assignment-submissions", id],
    queryFn: () =>
      assignmentsAPI.submissions(id!).then((r) => r.data.submissions),
    enabled: !!id,
    staleTime: 15000,
  });

export const useCreateAssignment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => assignmentsAPI.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["assignments"] });
      toast.success("Assignment created!");
    },
    onError: (e: any) =>
      toast.error(e.response?.data?.message || "Failed to create"),
  });
};

export const useUpdateAssignment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      assignmentsAPI.update(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ["assignments"] });
      qc.invalidateQueries({ queryKey: ["assignment", id] });
      toast.success("Assignment updated");
    },
    onError: (e: any) =>
      toast.error(e.response?.data?.message || "Failed to update"),
  });
};

export const useDeleteAssignment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => assignmentsAPI.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["assignments"] });
      toast.success("Assignment deleted");
    },
    onError: () => toast.error("Failed to delete"),
  });
};

export const useSubmitAssignment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, submission }: { id: string; submission: any }) =>
      assignmentsAPI.submit(id, { submission }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["assignments"] });
      toast.success("Assignment submitted!");
    },
    onError: (e: any) =>
      toast.error(e.response?.data?.message || "Submission failed"),
  });
};

export const useGradeSubmission = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      assignmentId,
      submissionId,
      grade,
      feedback,
    }: {
      assignmentId: string;
      submissionId: string;
      grade?: number;
      feedback?: string;
    }) => assignmentsAPI.grade(assignmentId, submissionId, { grade, feedback }),
    onSuccess: (_, { assignmentId }) => {
      qc.invalidateQueries({
        queryKey: ["assignment-submissions", assignmentId],
      });
      qc.invalidateQueries({ queryKey: ["assignments"] });
      toast.success("Grade saved!");
    },
    onError: (e: any) =>
      toast.error(e.response?.data?.message || "Failed to save grade"),
  });
};
