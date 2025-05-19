import { createLogDash } from '@logdash/core';

const bigJson = {
  key1: 'value1',
  key2: 'value2',
  key3: 'value3',
  key4: 'value4',
  nestedKey: {
    key1: 'value1',
    key2: 'value2',
    key3: 'value3',
    key4: 'value4',
    nestedKey: {
      key1: 'value1',
      key2: 'value2',
      key3: 'value3',
      key4: 'value4',
      nestedKey: {
        key1: 'value1',
        key2: 'value2',
        key3: 'value3',
        key4: 'value4',
        nestedKey: {
          key1: 'value1',
          key2: 'value2',
          key3: 'value3',
          key4: 'value4',
          nestedKey: {
            key1: 'value1',
            key2: 'value2',
            key3: 'value3',
            key4: 'value4',
            key5: 'value5',
            key6: 'value6',
            key7: 'value7',
            key8: 'value8',
            key9: 'value9',
            key10: 'value10',
            key11: 'value11',
            key12: 'value12',
            key13: 'value13',
            key14: 'value14',
            key15: 'value15',
            key16: 'value16',
            key17: 'value17',
            key18: 'value18',
            key19: 'value 19',
            key20: 'value20',
            key21: 'value21',
            key22: 'value22',
            key23: 'value23',
            key24: 'value24',
            key25: 'value25',
            key26: 'value26',
            key27: 'value27',
            key28: 'value28',
            longKey:
              'longValue_longValue_longValue_longValue_longValue_longValue_longValue_longValue_longValue_longValue_longValue_longValue_longValue_longValue',
          },
        },
      },
    },
  },
};

const { logger } = createLogDash({
  apiKey: 'mXDkPpQ86FzoUVlS5tI8luD3a9ZskQh3',
});

// logger.info('Hello logdash!');

// logger.info('Hello logdash 1!');
// logger.info('Hello logdash 2!');
// logger.info(
//  'Long log log log log log log log logogogogogogogogogogogogogogogogogogogogogogog log log log log log',
// );
// logger.debug(
//  'logogogogogogogogogogogogogogogogogogogogogogoglogogogogogogogogogogogogogogogogogogogogogogoglogogogogogogogogogogogogogogogogogogogogogogo',
// );
// logger.warn('Warn logdash 4!');
// logger.warn('Warn logdash 4X!');
// logger.warn('Warn logdash 4D!');
// logger.warn('Warn logdash 4LUL!');
// logger.error('test error!');

// loop for 1000 times to test the performance
// for (let i = 0; i < 100_000; i++) {
//  logger.warn(`Stress test ${i} ${JSON.stringify(bigJson)}`);
// }

let i = 0;
setInterval(() => {
  // randomly send info, warn or error:

  i++;
  if (i % 3 === 0) {
    logger.log(`Stress test ${i} ${JSON.stringify(bigJson)}`);
  } else if (i % 3 === 1) {
    logger.warn(`Stress test ${i} ${JSON.stringify(bigJson)}`);
  } else {
    logger.error(`Stress test ${i} ${JSON.stringify(bigJson)}`);
  }
}, 10);
