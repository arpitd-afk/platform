import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { messagesAPI, api } from "../api";
import { getSocket, getSocketInstance } from "./useSocket";
import toast from "react-hot-toast";

export const useConversations = () =>
  useQuery({
    queryKey: ["conversations"],
    queryFn: () =>
      messagesAPI.conversations().then((r) => r.data.conversations),
    refetchInterval: 15000,
    staleTime: 5000,
  });

export const useMessages = (userId?: string) =>
  useQuery({
    queryKey: ["messages", userId],
    queryFn: () =>
      messagesAPI.getMessages(userId!).then((r) => r.data.messages),
    enabled: !!userId,
    staleTime: 0,
  });

export const useContacts = () =>
  useQuery({
    queryKey: ["message-contacts"],
    queryFn: () => messagesAPI.contacts().then((r) => r.data.contacts),
    staleTime: 60000,
  });

export const useSendMessage = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      receiverId,
      content,
    }: {
      receiverId: string;
      content: string;
    }) => messagesAPI.send(receiverId, content),
    onError: () => toast.error("Failed to send message"),
  });
};

export const useDeleteMessage = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (messageId: string) => api.delete(`/messages/${messageId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["messages"] });
      qc.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: () => toast.error("Failed to delete message"),
  });
};

// Hook that wires socket events to query cache for real-time updates
export const useMessageSocket = (
  currentUserId?: string,
  selectedContactId?: string,
) => {
  const qc = useQueryClient();

  useEffect(() => {
    if (!currentUserId) return;
    const socket = getSocketInstance();
    if (!socket) return;

    const onNewMessage = (msg: any) => {
      const otherId =
        msg.sender_id === currentUserId ? msg.receiver_id : msg.sender_id;
      // Append to message thread
      qc.setQueryData(["messages", otherId], (old: any[]) =>
        old ? [...old.filter((m) => m.id !== msg.id), msg] : [msg],
      );
      // Refresh conversations
      qc.invalidateQueries({ queryKey: ["conversations"] });
    };

    const onDeleted = ({ id }: { id: string }) => {
      qc.setQueriesData({ queryKey: ["messages"] }, (old: any) =>
        Array.isArray(old) ? old.filter((m: any) => m.id !== id) : old,
      );
    };

    const onUserOnline = ({ userId }: { userId: string }) => {
      qc.setQueryData(
        ["online-users"],
        (old: Set<string> = new Set()) => new Set([...old, userId]),
      );
    };

    socket.on("message:new", onNewMessage);
    socket.on("message:deleted", onDeleted);
    socket.on("user:online", onUserOnline);

    return () => {
      socket.off("message:new", onNewMessage);
      socket.off("message:deleted", onDeleted);
      socket.off("user:online", onUserOnline);
    };
  }, [currentUserId, qc]);
};

export const useBatchMessages = (batchId?: string) =>
  useQuery({
    queryKey: ["batch-messages", batchId],
    queryFn: () =>
      messagesAPI.batchMessages(batchId!).then((r) => r.data.messages),
    enabled: !!batchId,
    staleTime: 0,
  });

export const useSendBatchMessage = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ batchId, content }: { batchId: string; content: string }) =>
      messagesAPI.sendBatch(batchId, content),
    onError: () => toast.error("Failed to send"),
  });
};

export const useDeleteBatchMessage = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ batchId, msgId }: { batchId: string; msgId: string }) =>
      messagesAPI.deleteBatch(batchId, msgId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["batch-messages"] }),
    onError: () => toast.error("Failed to delete"),
  });
};
