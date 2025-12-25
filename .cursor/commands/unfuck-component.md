this component is just terribly written, make it more readable and delegate certain responsibilities to proper layers @apps/frontend/.cursor/rules/default.mdc

Steps:

1. Read the component and understand the responsibility
2. Delegate certain responsibilities to the proper layers
3. Make the component easy to skim through and reason about

Extract presentational components if they are generic and used in multiple places, if there are multiple usages within a single file just use a #snippet.

Don't add any comments to the code, just unfuck it.
