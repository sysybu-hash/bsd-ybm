export type { ContractSignedNotifyInput } from '@/services/notifications/WhatsAppService';
export { WhatsAppService } from '@/services/notifications/WhatsAppService';

import { WhatsAppService } from '@/services/notifications/WhatsAppService';
import type { ContractSignedNotifyInput } from '@/services/notifications/WhatsAppService';

/** @deprecated Prefer `WhatsAppService.sendContractSignedAlert`. */
export async function notifyContractorContractSigned(input: ContractSignedNotifyInput) {
  return WhatsAppService.sendContractSignedAlert(input);
}
