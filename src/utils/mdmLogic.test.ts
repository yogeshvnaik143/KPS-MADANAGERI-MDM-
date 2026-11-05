import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateSectionSummaries,
  calculateOverallSummary,
  autoBalanceNutrition,
  aggregateMultiDayRecords,
} from './mdmLogic';
import { DailyMDMRecord, MasterAdmission, ALL_CLASSES } from '../types/mdm';

const sampleMaster: MasterAdmission = {
  schoolName: 'Karnataka Public School, Madanageri',
  diseCode: '29010203040',
  academicYear: '2026-27',
  lastUpdated: '2026-11-01',
  admissions: {
    LKG: { classId: 'LKG', boys: 10, girls: 10, total: 20 },
    UKG: { classId: 'UKG', boys: 12, girls: 13, total: 25 },
    '1': { classId: '1', boys: 15, girls: 15, total: 30 },
    '2': { classId: '2', boys: 14, girls: 16, total: 30 },
    '3': { classId: '3', boys: 18, girls: 12, total: 30 },
    '4': { classId: '4', boys: 16, girls: 14, total: 30 },
    '5': { classId: '5', boys: 20, girls: 15, total: 35 },
    '6': { classId: '6', boys: 22, girls: 18, total: 40 },
    '7': { classId: '7', boys: 20, girls: 20, total: 40 },
    '8': { classId: '8', boys: 25, girls: 20, total: 45 },
    '9': { classId: '9', boys: 24, girls: 26, total: 50 },
    '10': { classId: '10', boys: 25, girls: 25, total: 50 },
  },
};

function createSampleRecord(): DailyMDMRecord {
  const classes: any = {};
  for (const cid of ALL_CLASSES) {
    classes[cid] = {
      classId: cid,
      boys: 10,
      girls: 10,
      total: 20,
      egg: 14,
      banana: 6, // 14 + 6 = 20 (balanced)
    };
  }

  return {
    id: '2026-11-05',
    date: '2026-11-05',
    scheme: 'SNF',
    schemeHeir: 'Sri Sathya Sai Annapoorna Foundation (SNF)',
    menuDetails: 'Rice, Sambar, Boiled Egg / Robusta Banana',
    classes,
    updatedAt: new Date().toISOString(),
  };
}

test('calculateOverallSummary computes exact attendance, eggs and banana balance', () => {
  const record = createSampleRecord();
  const summary = calculateOverallSummary(record, sampleMaster);

  assert.equal(summary.attendedBoys, 120); // 12 classes * 10
  assert.equal(summary.attendedGirls, 120);
  assert.equal(summary.attendedTotal, 240);
  assert.equal(summary.eggTotal, 168); // 12 * 14
  assert.equal(summary.bananaTotal, 72); // 12 * 6
  assert.equal(summary.nutritionTotal, 240);
  assert.equal(summary.isBalanced, true);
  assert.equal(summary.discrepancy, 0);
});

test('calculateSectionSummaries correctly aggregates the 4 required sections', () => {
  const record = createSampleRecord();
  const sections = calculateSectionSummaries(record, sampleMaster);

  // 1st Section: LKG & UKG (2 classes * 20 = 40 attended)
  assert.equal(sections.LKG_UKG.attendedTotal, 40);
  assert.equal(sections.LKG_UKG.eggCount, 28);
  assert.equal(sections.LKG_UKG.bananaCount, 12);
  assert.equal(sections.LKG_UKG.isBalanced, true);

  // 2nd Section: 1 to 5 (5 classes * 20 = 100 attended)
  assert.equal(sections.PRIMARY_1_5.attendedTotal, 100);
  assert.equal(sections.PRIMARY_1_5.eggCount, 70);
  assert.equal(sections.PRIMARY_1_5.bananaCount, 30);

  // 3rd Section: 6 to 8 (3 classes * 20 = 60 attended)
  assert.equal(sections.HIGHER_6_8.attendedTotal, 60);

  // 4th Section: 9 to 10 (2 classes * 20 = 40 attended)
  assert.equal(sections.HIGH_9_10.attendedTotal, 40);
});

test('autoBalanceNutrition fills remaining attendees with bananas', () => {
  const record = createSampleRecord();
  // Disrupt balance in Class 1: 10 boys, 10 girls = 20 attendees. Set egg = 15, banana = 0 (unbalanced)
  record.classes['1'].egg = 15;
  record.classes['1'].banana = 0;

  const balanced = autoBalanceNutrition(record, 'fill-banana');
  assert.equal(balanced.classes['1'].egg, 15);
  assert.equal(balanced.classes['1'].banana, 5); // 20 - 15 = 5
  assert.equal(balanced.classes['1'].egg + balanced.classes['1'].banana, 20);
});

test('aggregateMultiDayRecords aggregates multiple daily records correctly', () => {
  const r1 = createSampleRecord();
  r1.scheme = 'SNF';
  const r2 = createSampleRecord();
  r2.id = '2026-11-06';
  r2.date = '2026-11-06';
  r2.scheme = 'APF';

  const agg = aggregateMultiDayRecords([r1, r2]);
  assert.equal(agg.workingDays, 2);
  assert.equal(agg.totalAttendance, 480);
  assert.equal(agg.avgDailyAttendance, 240);
  assert.equal(agg.schemeBreakdown['SNF'].days, 1);
  assert.equal(agg.schemeBreakdown['APF'].days, 1);
});

test('KPS Madanageri official admission baseline matches PDF (253 students)', () => {
  const kpsMaster: MasterAdmission = {
    schoolName: 'Karnataka Public School, Madanageri',
    diseCode: '29010401802',
    academicYear: '2026-27',
    lastUpdated: '2026-11-01',
    admissions: {
      LKG: { classId: 'LKG', boys: 17, girls: 18, total: 35 },
      UKG: { classId: 'UKG', boys: 0, girls: 0, total: 0 },
      '1': { classId: '1', boys: 3, girls: 4, total: 7 },
      '2': { classId: '2', boys: 9, girls: 6, total: 15 },
      '3': { classId: '3', boys: 7, girls: 5, total: 12 },
      '4': { classId: '4', boys: 9, girls: 9, total: 18 },
      '5': { classId: '5', boys: 11, girls: 11, total: 22 },
      '6': { classId: '6', boys: 18, girls: 16, total: 34 },
      '7': { classId: '7', boys: 28, girls: 22, total: 50 },
      '8': { classId: '8', boys: 13, girls: 15, total: 28 },
      '9': { classId: '9', boys: 17, girls: 15, total: 32 },
      '10': { classId: '10', boys: 0, girls: 0, total: 0 },
    },
  };

  const dummyRecord = createSampleRecord();
  const sections = calculateSectionSummaries(dummyRecord, kpsMaster);

  // Pre-school (LKG + UKG)
  assert.equal(sections.LKG_UKG.enrolledBoys, 17);
  assert.equal(sections.LKG_UKG.enrolledGirls, 18);
  assert.equal(sections.LKG_UKG.enrolledTotal, 35);

  // 1 to 5 (Lower primary)
  assert.equal(sections.PRIMARY_1_5.enrolledBoys, 39); // 3+9+7+9+11
  assert.equal(sections.PRIMARY_1_5.enrolledGirls, 35); // 4+6+5+9+11
  assert.equal(sections.PRIMARY_1_5.enrolledTotal, 74);

  // 6 to 8 (Higher primary)
  assert.equal(sections.HIGHER_6_8.enrolledBoys, 59); // 18+28+13
  assert.equal(sections.HIGHER_6_8.enrolledGirls, 53); // 16+22+15
  assert.equal(sections.HIGHER_6_8.enrolledTotal, 112);

  // 9th (High school)
  assert.equal(sections.HIGH_9_10.enrolledBoys, 17);
  assert.equal(sections.HIGH_9_10.enrolledGirls, 15);
  assert.equal(sections.HIGH_9_10.enrolledTotal, 32);

  // Total
  const overall = calculateOverallSummary(dummyRecord, kpsMaster);
  assert.equal(overall.enrolledBoys, 132);
  assert.equal(overall.enrolledGirls, 121);
  assert.equal(overall.enrolledTotal, 253);
});

