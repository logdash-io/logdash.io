import { LogdashSDKName } from '$lib/domains/shared/types.js';

export const INSTALL_COMMANDS: Record<LogdashSDKName, string> = {
  [LogdashSDKName.NODE_JS]: 'npm install @logdash/node',
  [LogdashSDKName.NEXT_JS]: 'npm install @logdash/node',
  [LogdashSDKName.SVELTE_KIT]: 'npm install @logdash/node',
  [LogdashSDKName.PYTHON]: 'pip install logdash',
  [LogdashSDKName.JAVA]: `// Maven
<dependency>
    <groupId>io.logdash</groupId>
    <artifactId>logdash</artifactId>
    <version>0.2.0</version>
</dependency>

// Gradle
implementation 'io.logdash:logdash:0.2.0'`,
  [LogdashSDKName.PHP]: 'composer require logdash/php-sdk',
  [LogdashSDKName.RUBY]: 'gem install logdash',
  [LogdashSDKName.DOTNET]: 'dotnet add package Logdash',
  [LogdashSDKName.RUST]: 'cargo add logdash',
  [LogdashSDKName.GO]: 'go get github.com/logdash-io/go-sdk/logdash',
  [LogdashSDKName.CURL]: 'curl',
};
