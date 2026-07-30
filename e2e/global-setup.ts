import { resetE2EDatabase } from "./support/database";

export default function globalSetup() {
  resetE2EDatabase();
}
