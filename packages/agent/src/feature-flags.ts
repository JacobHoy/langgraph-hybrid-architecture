export interface FeatureFlags {
  enableBuiltInTools: boolean;
  enableStructuredOutput: boolean;
  enableFileSearch: boolean;
  enableRetrieval: boolean;
  enableComputerUse: boolean;
}

class FeatureFlagManager {
  private flags: FeatureFlags = {
    enableBuiltInTools: true,
    enableStructuredOutput: false,
    enableFileSearch: false,
    enableRetrieval: false,
    enableComputerUse: false
  };

  // Built-in tools management
  shouldEnableBuiltInTools(): boolean {
    return this.flags.enableBuiltInTools;
  }

  enableBuiltInTools() {
    this.flags.enableBuiltInTools = true;
    this.logFlags();
  }

  disableBuiltInTools() {
    this.flags.enableBuiltInTools = false;
    this.logFlags();
  }

  toggleBuiltInTools() {
    this.flags.enableBuiltInTools = !this.flags.enableBuiltInTools;
    this.logFlags();
  }

  // Structured output management
  shouldEnableStructuredOutput(): boolean {
    return this.flags.enableStructuredOutput;
  }

  enableStructuredOutput() {
    this.flags.enableStructuredOutput = true;
    this.logFlags();
  }

  disableStructuredOutput() {
    this.flags.enableStructuredOutput = false;
    this.logFlags();
  }

  toggleStructuredOutput() {
    this.flags.enableStructuredOutput = !this.flags.enableStructuredOutput;
    this.logFlags();
  }

  // File search management
  shouldEnableFileSearch(): boolean {
    return this.flags.enableFileSearch;
  }

  enableFileSearch() {
    this.flags.enableFileSearch = true;
    this.logFlags();
  }

  disableFileSearch() {
    this.flags.enableFileSearch = false;
    this.logFlags();
  }

  toggleFileSearch() {
    this.flags.enableFileSearch = !this.flags.enableFileSearch;
    this.logFlags();
  }

  // Retrieval management
  shouldEnableRetrieval(): boolean {
    return this.flags.enableRetrieval;
  }

  enableRetrieval() {
    this.flags.enableRetrieval = true;
    this.logFlags();
  }

  disableRetrieval() {
    this.flags.enableRetrieval = false;
    this.logFlags();
  }

  toggleRetrieval() {
    this.flags.enableRetrieval = !this.flags.enableRetrieval;
    this.logFlags();
  }

  // Computer use management
  shouldEnableComputerUse(): boolean {
    return this.flags.enableComputerUse;
  }

  enableComputerUse() {
    this.flags.enableComputerUse = true;
    this.logFlags();
  }

  disableComputerUse() {
    this.flags.enableComputerUse = false;
    this.logFlags();
  }

  toggleComputerUse() {
    this.flags.enableComputerUse = !this.flags.enableComputerUse;
    this.logFlags();
  }

  // Get all flags
  getFlags(): FeatureFlags {
    return { ...this.flags };
  }

  private logFlags() {
    console.log('🔧 Feature flags updated:', this.flags);
  }
}

export const featureFlags = new FeatureFlagManager();
