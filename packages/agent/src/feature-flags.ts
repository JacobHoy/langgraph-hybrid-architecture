export interface FeatureFlags {
  enableBuiltInTools: boolean;
  enableJsonSchemaOutput: boolean;
}

class FeatureFlagManager {
  private flags: FeatureFlags = {
    enableBuiltInTools: true,
    enableJsonSchemaOutput: false
  };

  /**
   * Get current feature flags
   */
  getFlags(): FeatureFlags {
    return { ...this.flags };
  }

  /**
   * Update feature flags
   */
  updateFlags(updates: Partial<FeatureFlags>): void {
    this.flags = { ...this.flags, ...updates };
    console.log('🔧 Feature flags updated:', this.flags);
  }

  /**
   * Check if built-in tools should be enabled
   */
  shouldEnableBuiltInTools(): boolean {
    return this.flags.enableBuiltInTools;
  }

  /**
   * Check if JSON schema output should be used
   */
  shouldUseJsonSchemaOutput(): boolean {
    return this.flags.enableJsonSchemaOutput;
  }

  /**
   * Enable built-in tools
   */
  enableBuiltInTools(): void {
    this.updateFlags({ enableBuiltInTools: true });
  }

  /**
   * Disable built-in tools
   */
  disableBuiltInTools(): void {
    this.updateFlags({ enableBuiltInTools: false });
  }

  /**
   * Toggle built-in tools
   */
  toggleBuiltInTools(): void {
    this.updateFlags({ enableBuiltInTools: !this.flags.enableBuiltInTools });
  }
}

// Export singleton instance
export const featureFlags = new FeatureFlagManager();
