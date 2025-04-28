import { Bindings } from "../models";
import * as repositories from "../repositories";

export async function getDashboardData(db: Bindings["DB"]) {
  const monitors = await repositories.getAllMonitors(db);
  const agents = await repositories.getAllAgents(db);

  if (monitors.monitors && monitors.monitors.length > 0) {
    monitors.monitors.forEach((monitor) => {
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
    monitors: monitors.monitors,
    agents: agents.results,
  };
}
