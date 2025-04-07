export interface ExplorationStatus {
  inProgress: boolean;
  complete: boolean;
  categoriesFound?: number;
  lastExploredId?: number;
  progress?: number;
  error?: string;
}
