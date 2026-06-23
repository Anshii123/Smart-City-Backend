import fs from 'fs';
import path from 'path';
import csvParser from 'csv-parser';
import Upload from '../models/Upload.js';
import CityData from '../models/CityData.js';
import { loadCityDataCache } from '../services/cityDataService.js';

// Helper to map row to schema safely
const mapRow = (row, uploadId) => {
  const findValue = (keywords) => {
    const key = Object.keys(row).find(k => 
      keywords.some(kw => k.toLowerCase().replace(/[^a-z0-9]/g, '').includes(kw.toLowerCase().replace(/[^a-z0-9]/g, '')))
    );
    return key ? row[key] : null;
  };

  const cityName = findValue(['cityname', 'city']);
  const latitude = parseFloat(findValue(['latitude', 'lat']));
  const longitude = parseFloat(findValue(['longitude', 'lng', 'lon']));
  const elevation = parseFloat(findValue(['elevation']));
  const temperature = parseFloat(findValue(['temperature', 'temp']));
  const landCover = findValue(['landcover', 'land_cover', 'cover']);
  const populationDensity = parseInt(findValue(['populationdensity', 'popdensity', 'population']), 10);
  const energyConsumption = parseFloat(findValue(['energyconsumption', 'energy']));
  const aqi = parseInt(findValue(['airquality', 'aqi']), 10);
  const urbanGreennessRatio = parseFloat(findValue(['urbangreenness', 'greenness', 'greennessratio']));

  if (
    cityName === null ||
    isNaN(latitude) ||
    isNaN(longitude) ||
    isNaN(elevation) ||
    isNaN(temperature) ||
    landCover === null ||
    isNaN(populationDensity) ||
    isNaN(energyConsumption) ||
    isNaN(aqi) ||
    isNaN(urbanGreennessRatio)
  ) {
    throw new Error('Row validation failed: missing or invalid required columns');
  }

  return {
    cityName: cityName.trim(),
    latitude,
    longitude,
    elevation,
    temperature,
    landCover: landCover.trim(),
    populationDensity,
    energyConsumption,
    aqi,
    urbanGreennessRatio,
    uploadId,
  };
};

// @desc    Upload & Parse Climate CSV Dataset
// @route   POST /api/uploads
// @access  Private
export const uploadDataset = async (req, res, next) => {
  if (!req.file) {
    const error = new Error('Please upload a CSV file');
    error.statusCode = 400;
    return next(error);
  }

  const filePath = req.file.path;
  let uploadRecord;

  try {
    uploadRecord = await Upload.create({
      filename: req.file.filename,
      originalname: req.file.originalname,
      size: req.file.size,
      uploadedBy: req.user._id,
      status: 'processing',
    });

    const parsedRows = [];
    let rowCount = 0;
    let streamFailed = false;

    const stream = fs.createReadStream(filePath)
      .pipe(csvParser());

    stream.on('data', (row) => {
      if (streamFailed) return;
      rowCount++;
      try {
        const mappedRow = mapRow(row, uploadRecord._id);
        parsedRows.push(mappedRow);
      } catch (err) {
        streamFailed = true;
        stream.destroy(new Error(`CSV Parsing Error at row ${rowCount}: ${err.message}`));
      }
    });

    stream.on('end', async () => {
      if (streamFailed) return;
      try {
        if (parsedRows.length > 0) {
          await CityData.insertMany(parsedRows);
          await loadCityDataCache();
        }

        uploadRecord.status = 'completed';
        uploadRecord.rowCount = parsedRows.length;
        await uploadRecord.save();

        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }

        res.status(201).json({
          success: true,
          message: `Successfully processed ${parsedRows.length} dataset rows.`,
          upload: uploadRecord,
        });
      } catch (endErr) {
        await failUpload(uploadRecord, filePath);
        next(endErr);
      }
    });

    stream.on('error', async (streamErr) => {
      await failUpload(uploadRecord, filePath);
      next(streamErr);
    });

  } catch (error) {
    if (uploadRecord) {
      await failUpload(uploadRecord, filePath);
    }
    next(error);
  }
};

const failUpload = async (uploadRecord, filePath) => {
  try {
    if (uploadRecord) {
      uploadRecord.status = 'failed';
      await uploadRecord.save();
    }
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (err) {
    console.error('Error during failUpload clean-up:', err);
  }
};

// @desc    Get Upload History
// @route   GET /api/uploads
// @access  Private
export const getUploadHistory = async (req, res, next) => {
  try {
    const history = await Upload.find({ uploadedBy: req.user._id })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: history.length,
      data: history,
    });
  } catch (error) {
    next(error);
  }
};
