const WebSocket = require('ws');

const wsUrl = 'ws://127.0.0.1:55587/devtools/page/0C9901836EE38673DAF3CF86F4A7DD37';
const ws = new WebSocket(wsUrl);

ws.on('open', () => {
  console.log('Connected to Chrome DevTools');
  
  const message = {
    id: 1,
    method: 'Runtime.evaluate',
    params: {
      expression: 'document.documentElement.outerHTML',
      returnByValue: true
    }
  };
  ws.send(JSON.stringify(message));
});

ws.on('message', (data) => {
  const response = JSON.parse(data.toString());
  if (response.id === 1) {
    if (response.result && response.result.result && response.result.result.value) {
      console.log('--- HTML START ---');
      console.log(response.result.result.value);
      console.log('--- HTML END ---');
    } else {
      console.error('Error evaluating script:', response);
    }
    ws.close();
  }
});

ws.on('error', (err) => {
  console.error('WebSocket error:', err);
});
