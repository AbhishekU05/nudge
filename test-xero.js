const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8').split('\n').reduce((acc, line) => {
  const [key, ...val] = line.split('=');
  if (key) acc[key] = val.join('=').replace(/^"|"$/g, '');
  return acc;
}, {});

Object.assign(process.env, env);

require('tsx/cli').run(['scratch/update-sync.ts']); // using tsx to run typescript
