import type { Component } from 'svelte';

export enum UserTier {
  FREE = 'free',
  EARLY_BIRD = 'early-bird',
  CONTRIBUTOR = 'contributor',
  PRO = 'pro',
}

export enum Feature {
  LOGGING = 'logging',
  METRICS = 'metrics',
  MONITORING = 'monitoring',
}

export enum LogdashSDKName {
  NODE_JS = 'NodeJS',
  PYTHON = 'Python',
  JAVA = 'Java',
  PHP = 'PHP',
  RUBY = 'Ruby',
  DOTNET = 'C#/DotNet',
  GO = 'Go',
  RUST = 'Rust',
  OTHER = 'Other',
}

export type LogdashSDK = {
  name: LogdashSDKName;
  icon: Component;
};
