import { useCallback } from 'react';
import { useRequestStore, useVariableStore } from '../store';
import { useSendMessage } from './useSendMessage';

export function useRequestState() {
  const currentRequest = useRequestStore((s) => s.currentRequest);
  const isSending = useRequestStore((s) => s.isSending);
  const setIsSending = useRequestStore((s) => s.setIsSending);
  const variables = useVariableStore((s) => s.variables);
  const sendMessage = useSendMessage();

  const sendRequest = useCallback(() => {
    if (isSending) {return;}
    setIsSending(true);

    sendMessage({
      command: 'sendRequest',
      payload: {
        request: currentRequest,
        variables: { variables },
      },
    });
  }, [currentRequest, isSending, setIsSending, sendMessage, variables]);

  return { sendRequest, isSending };
}
