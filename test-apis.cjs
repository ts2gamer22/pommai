// Test API Connections for Pommai

const https = require('https');

// Test OpenRouter API
function testOpenRouter() {
  const apiKey = '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';
  
  const data = JSON.stringify({
    model: "openai/gpt-3.5-turbo",
    messages: [
      {role: "user", content: "Say 'API working' if you can hear me"}
    ],
    max_tokens: 10
  });

  const options = {
    hostname: 'openrouter.ai',
    path: '/api/v1/chat/completions',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://pommai.co',
      'X-Title': 'Pommai Test'
    }
  };

  const req = https.request(options, (res) => {
    let responseBody = '';
    
    res.on('data', (chunk) => {
      responseBody += chunk;
    });
    
    res.on('end', () => {
      try {
        const response = JSON.parse(responseBody);
        if (response.choices && response.choices[0]) {
          console.log('✅ OpenRouter API: Working');
          console.log('   Response:', response.choices[0].message.content);
        } else if (response.error) {
          console.log('❌ OpenRouter API Error:', response.error.message);
        }
      } catch (e) {
        console.log('❌ OpenRouter API: Failed to parse response');
      }
    });
  });

  req.on('error', (e) => {
    console.log('❌ OpenRouter API: Connection failed -', e.message);
  });

  req.write(data);
  req.end();
}

// Test ElevenLabs API
function testElevenLabs() {
  const apiKey = 'sk_5c10eb2b6c46788bf8c18464f9b2efff27f4b091163e8738';
  
  const options = {
    hostname: 'api.elevenlabs.io',
    path: '/v1/voices',
    method: 'GET',
    headers: {
      'xi-api-key': apiKey
    }
  };

  const req = https.request(options, (res) => {
    let responseBody = '';
    
    res.on('data', (chunk) => {
      responseBody += chunk;
    });
    
    res.on('end', () => {
      try {
        const response = JSON.parse(responseBody);
        if (response.voices) {
          console.log('✅ ElevenLabs API: Working');
          console.log('   Available voices:', response.voices.length);
        } else if (response.detail) {
          console.log('❌ ElevenLabs API Error:', response.detail);
        }
      } catch (e) {
        console.log('❌ ElevenLabs API: Failed to parse response');
      }
    });
  });

  req.on('error', (e) => {
    console.log('❌ ElevenLabs API: Connection failed -', e.message);
  });

  req.end();
}

// Test OpenAI/Whisper API
function testWhisper() {
  const apiKey = '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';
  
  const options = {
    hostname: 'api.openai.com',
    path: '/v1/models',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${apiKey}`
    }
  };

  const req = https.request(options, (res) => {
    let responseBody = '';
    
    res.on('data', (chunk) => {
      responseBody += chunk;
    });
    
    res.on('end', () => {
      try {
        const response = JSON.parse(responseBody);
        if (response.data) {
          const whisperModel = response.data.find(m => m.id.includes('whisper'));
          if (whisperModel) {
            console.log('✅ OpenAI/Whisper API: Working');
            console.log('   Whisper model available:', whisperModel.id);
          } else {
            console.log('⚠️  OpenAI API works but Whisper model not found');
          }
        } else if (response.error) {
          console.log('❌ OpenAI API Error:', response.error.message);
        }
      } catch (e) {
        console.log('❌ OpenAI API: Failed to parse response');
      }
    });
  });

  req.on('error', (e) => {
    console.log('❌ OpenAI API: Connection failed -', e.message);
  });

  req.end();
}

// Test Convex connection
function testConvex() {
  const convexUrl = 'https://original-jay-795.convex.cloud';
  
  const options = {
    hostname: 'original-jay-795.convex.cloud',
    path: '/',
    method: 'GET'
  };

  const req = https.request(options, (res) => {
    if (res.statusCode === 200 || res.statusCode === 404) {
      console.log('✅ Convex Backend: Reachable');
      console.log('   URL:', convexUrl);
    } else {
      console.log('⚠️  Convex Backend: Unexpected status', res.statusCode);
    }
  });

  req.on('error', (e) => {
    console.log('❌ Convex Backend: Connection failed -', e.message);
  });

  req.end();
}

console.log('=================================');
console.log('Testing Pommai API Integrations');
console.log('=================================\n');

// Run all tests
testOpenRouter();
testElevenLabs();
testWhisper();
testConvex();

console.log('\n(Results will appear above as tests complete)');
