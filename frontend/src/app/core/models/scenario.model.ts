export interface ChecklistItemDto {
  id: string;
  text: string;
  sortOrder: number;
  isCompleted: boolean;
}

export interface ScenarioSummaryDto {
  id: string;
  name: string;
  description: string;
  itemCount: number;
  completedCount: number;
}

export interface ScenarioDto {
  id: string;
  name: string;
  description: string;
  items: ChecklistItemDto[];
}

export interface CreateScenarioRequest {
  name: string;
  description: string;
}
