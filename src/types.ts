import { ZetaIconError } from "@zebra-fed/zeta-icon-validator";

export interface IconErrors {
  name: string;
  id: string;
  errors: ZetaIconError[];
}
