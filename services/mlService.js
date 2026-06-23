import { execFile, spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let pyProcess = null;

export const startModelServer = () => {
  if (pyProcess) return;

  const scriptPath = path.resolve(__dirname, '../../ml-model/server.py');
  const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
  
  console.log(`[ML Server] Starting persistent Python prediction service...`);
  
  pyProcess = spawn(pythonCmd, [scriptPath, '5005'], {
    stdio: ['ignore', 'pipe', 'pipe']
  });

  pyProcess.stdout.on('data', (data) => {
    console.log(`[ML Server Stdout]: ${data.toString().trim()}`);
  });

  pyProcess.stderr.on('data', (data) => {
    console.error(`[ML Server Stderr]: ${data.toString().trim()}`);
  });

  pyProcess.on('close', (code) => {
    console.log(`[ML Server] Prediction service exited with code ${code}`);
    pyProcess = null;
  });

  pyProcess.on('error', (err) => {
    console.error(`[ML Server Error] Failed to start Python process: ${err.message}`);
    pyProcess = null;
  });

  // Ensure child process is killed when Node exits
  const killPyProcess = () => {
    if (pyProcess) {
      console.log('[ML Server] Shutting down persistent Python process...');
      pyProcess.kill();
      pyProcess = null;
    }
  };

  process.on('exit', killPyProcess);
  process.on('SIGINT', () => {
    killPyProcess();
    process.exit();
  });
  process.on('SIGTERM', () => {
    killPyProcess();
    process.exit();
  });
};

const getPredictionsFallback = (params) => {
  return new Promise((resolve, reject) => {
    const scriptPath = path.resolve(__dirname, '../../ml-model/predict.py');
    
    const args = [
      scriptPath,
      '--lat', params.latitude.toString(),
      '--lng', params.longitude.toString(),
      '--elevation', params.elevation.toString(),
      '--temp', params.temperature.toString(),
      '--landcover', params.landCover,
      '--popdensity', params.populationDensity.toString(),
      '--energy', params.energyConsumption.toString(),
      '--aqi', params.aqi.toString(),
      '--greenness', params.urbanGreennessRatio.toString()
    ];

    const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';

    execFile(pythonCmd, args, (error, stdout, stderr) => {
      if (error) {
        return reject(new Error(`ML Model execution failed: ${stderr || error.message}`));
      }

      try {
        const predictions = JSON.parse(stdout);
        if (predictions.error) {
          return reject(new Error(`ML Model prediction error: ${predictions.error}`));
        }
        resolve(predictions);
      } catch (parseErr) {
        reject(new Error(`Failed to parse ML Model output: ${parseErr.message}. Output was: ${stdout}`));
      }
    });
  });
};

export const getPredictions = (params) => {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(params);

    const options = {
      hostname: '127.0.0.1',
      port: 5005,
      path: '/predict',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.setEncoding('utf-8');
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const predictions = JSON.parse(body);
          if (predictions.error) {
            reject(new Error(predictions.error));
          } else {
            resolve(predictions);
          }
        } catch (err) {
          reject(new Error(`Failed to parse ML response: ${err.message}. Raw: ${body}`));
        }
      });
    });

    req.on('error', (err) => {
      console.warn(`[ML Service] Connection to prediction server failed: ${err.message}. Running script fallback...`);
      getPredictionsFallback(params).then(resolve).catch(reject);
    });

    req.write(postData);
    req.end();
  });
};
