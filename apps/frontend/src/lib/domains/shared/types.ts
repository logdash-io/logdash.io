import type { Component } from 'svelte';

export enum UserTier {
  FREE = 'free',
  EARLY_USER = 'early-user',
  CONTRIBUTOR = 'contributor',
  EARLY_BIRD = 'early-bird',
  BUILDER = 'builder',
  PRO = 'pro',
}

export enum Feature {
  LOGGING = 'logging',
  METRICS = 'metrics',
  MONITORING = 'monitoring',
}

export enum LogdashSDKName {
  NODE_JS = 'NodeJS',
  NEXT_JS = 'NextJS',
  SVELTE_KIT = 'SvelteKit',
  PYTHON = 'Python',
  JAVA = 'Java',
  PHP = 'PHP',
  RUBY = 'Ruby',
  DOTNET = 'C#/DotNet',
  GO = 'Go',
  RUST = 'Rust',
  CURL = 'Curl',
}

export type LogdashSDK = {
  name: LogdashSDKName;
  icon: Component;
};
