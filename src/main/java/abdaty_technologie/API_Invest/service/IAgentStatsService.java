package abdaty_technologie.API_Invest.service;

import abdaty_technologie.API_Invest.dto.responses.AgentStatsResponse;

public interface IAgentStatsService {
    AgentStatsResponse getAgentStats(String agentEmail);
}
