const request = require('request');

async function main() {
  await addText([
    'Vanflux',
    'was',
    'here',
    '3>',
    '---',
    'fe',
    'yo',
  ], 9968);
}

async function addText(lines, score) {
  for (const line of lines) {
    console.log('Creating game client for line', line);
    const gameClient = await createGameClient(line);
    console.log('Token', gameClient.token());
    console.log('Sending score');
    console.log(await gameClient.sendScore(score));
    console.log('Score sent');
  }
}

function calculate(score) {
  const maxSpeed = 13;
  const acceleration = 0.001;
  const msPerFrame = 16.666666666666668;
  const delta = 50;
  const coefficient = 0.025;

  let speed = 6;
  let distanceRan = 0;
  let runningTime = 0;

  while(true) {
    runningTime += delta;
    distanceRan += speed * delta / msPerFrame;
    if (speed < maxSpeed) {
      speed += acceleration
    }
    const curScore = Math.round(distanceRan * coefficient);
    if (curScore >= score) break;
  }

  return {distanceRan, runningTime};
}

async function createGameClient(username) {
  const httpClient = createHttpClient();
  const {body: indexBody} = await httpClient.request({
    url: '/',
  });
  const token = (indexBody.match(/id="token" *value="(\w+)"/) || [])[1];

  return {
    token: () => token,
    async sendScore(score) {
      const {distanceRan, runningTime} = calculate(score);
      const {body: body1} = await httpClient.request({
        method: 'GET',
        url: '/ajax/qufw/?points=' + score,
        headers: {
          Referer: 'https://trex-runner.com/',
        },
      });
      if (!body1.match(/You took \d+ place\!/)) return { error: 'Points get request failed' };
      const {body, response} = await httpClient.request({
        method: 'POST',
        url: '/ajax/qufw/',
        form: {
          name: username,
          points: score,
          dist: distanceRan,
          t: runningTime,
          token,
        },
        headers: {
          Referer: 'https://trex-runner.com/',
        },
      });
      console.log(body, score);
      if (!body?.endsWith(score)) return { error: 'Post points request failed' };
      return {distanceRan, runningTime};
    }
  };
}

function createHttpClient() {
  const jar = request.jar();
  const httpClient = request.defaults({
    baseUrl: 'https://trex-runner.com/',
    jar,
  });
  return {
    async request(opts) {
      return new Promise(resolve => httpClient(opts, (error, response, body) => resolve({error, response, body})));
    },
    jar() {
      return jar;
    },
  };
}

main();
