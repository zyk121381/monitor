import { Bindings } from "../models";
import * as repositories from "../repositories";

export async function getDashboardData(db: Bindings["DB"]) {
  const monitors = await repositories.getAllMonitorsWithoutHistory(db);
  const agents = await repositories.getAllAgents(db);

  if (monitors.results && monitors.results.length > 0) {
    monitors.results.forEach((monitor) => {
      if (typeof monitor.headers === "string") {
        try {
          monitor.headers = JSON.parse(monitor.headers);
        } catch (e) {
          monitor.headers = {};
        }
      }
    });
  }
  return {
    monitors: monitors.results,
    agents: agents.results,
  };
}
