import { ExternalLinkIcon, InfoIcon } from '@chakra-ui/icons';
import { useState, useEffect } from 'react';
import {
  Box,
  Link,
  Table,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Tooltip as Tip,
  Tr,
  useColorModeValue,
  useMediaQuery,
  Fade,
} from '@chakra-ui/react';
import moment from 'moment';
import { useSelector } from 'react-redux';
import {
  Area,
  AreaChart,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { selectSingleTokenInfo } from '../../reducers/tokens.js';
import { smartNumber } from '../Inline.js';
// import { fetchPairs } from '../reducers/pairs.js';
import { first_tick } from '../../config.js';
import TradingViewWidget from './TradingViewWidget.jsx';
import { bigTickFormatter } from '../../utils.js';
//https://github.com/recharts/recharts/issues/956
import { dexColors } from '../../utils/colors.js';
import { checkValidCandleWidth, getValidCandleWidthOptions } from '../../utils/chartUtils.js';
import CustomParamsSelector from './chartParamsSelector.jsx';

export const PriceChart = ({ symbol, onChangePeriod, info }) => {
  const [chartType, setChartType] = useState('line');
  const config = useSelector(state => state.config);
  const baseCurrency = useSelector(state => state.config.baseCurrency);
  const baseCurrencySymbol = config.tokens[baseCurrency].symbol;
  const [isLarge] = useMediaQuery('(min-width: 1024px)');
  const [candleWidth, setCandleWidth] = useState('5m');
  const bg2 = useColorModeValue(
    'linear-gradient(180deg, rgba(227,232,239,1) 0%, rgba(234,239,245,1) 14%)',
    'linear-gradient(180deg, rgba(23,25,34,1) 0%, rgba(27,32,43,1) 100%)'
  );
  const tableCss = {
    '&::-webkit-scrollbar': {
      height: '18px',
    },
    '&::-webkit-scrollbar-track': {
      background: useColorModeValue('#fff', '#1b202b'),
    },
    '&::-webkit-scrollbar-thumb': {
      backgroundColor: useColorModeValue('#d3d6dc', '#383d47'),
      borderRadius: '9px',
      border: useColorModeValue('4px solid #fff', '4px solid #1b202b'),
    },
  };

  const period = useSelector(state => state.page.params.period);

  const [candleWidthOptions, setCandleWidthOptions] = useState([]);

  useEffect(() => {
    const options = getValidCandleWidthOptions(period);
    setCandleWidthOptions(options);
    setCandleWidth(options[0].value);
  }, [period]);

  let data = useSelector(selectSingleTokenInfo({ period, symbol }));
  const bg = useColorModeValue(
    'linear-gradient(0deg, rgba(227,232,239,1) 0%, rgba(234,239,245,1) 15%)',
    'linear-gradient(180deg, rgba(23,25,34,1) 86%, rgba(15,17,26,0.6) 100%)'
  );

  if (!data) return null;
  const isDex = data
    ? data.sources.findIndex(z => z.source.id === 'xrc') === -1
    : false;
  const locking = 'sns' in data.tokencfg.locking;
  const activeDotStyle = { r: 1, stroke: '#445566', zIndex: 1000 };

  const days_from_start = daysFromStart();
  

  return (
    <>
      <Box pt="5px" >
        <Box maxW="1278px" m="auto" borderWidth='0.5px' bg='rgba(15,17,26,0.6)' borderColor={'gray.700'} borderRadius='lg' overflow='clip'>
          <Box p={2} w='100%' bg={'rgba(23,25,34,1)'} borderBottomWidth='0.5px' borderColor={'gray.700'}>
            <CustomParamsSelector
              {...{
                chartType,
                setChartType,
                days_from_start,
                candleWidth,
                setCandleWidth,
                candleWidthOptions,
                onChangePeriod,
                period
              }}
            />

          </Box>
          <Box pl={2} pt={2} >
          
          {chartType === 'line' && (
            <Fade in={chartType === 'line'}
              transition={{ exit: { delay: 1 }, enter: { duration: 0.5 } }}>
              <ResponsiveContainer width={'100%'} height={400}>
                <LineChart
                  data={data.merged}
                  margin={{ top: 20, bottom: 10 }}
                  syncId="main"
                >
                  {Array(data.lines)
                    .fill(0)
                    .map((_, idx) => (
                      <Line
                        isAnimationActive={false}
                        key={idx}
                        type="line"
                        dataKey={'p' + idx}
                        strokeWidth={2}
                        stroke={dexColors[idx]}
                        dot={false}
                        activeDot={activeDotStyle}
                      />
                    ))}

                  <YAxis
                    orientation="right"
                    dx={5}
                    stroke="#8893a8"
                    domain={['auto', 'auto']}
                    axisLine={false}
                    tickLine={{
                      stroke: '#334455',
                    }}
                    tick={{ fontSize: '12px' }}
                  />
                  <XAxis
                    hide={false}
                    domain={['auto', 'auto']}
                    type="number"
                    dataKey="t"
                    scale="time"
                    dy={5}
                    dx={32}
                    minTickGap={50}
                    tickFormatter={t =>
                      period <= 24
                        ? moment.unix(t).format('HH:mm')
                        : moment.unix(t).format('Do MMM')
                    }
                    interval={'equidistantPreserveStart'}
                    tick={{ fill: '#8893a8' }}
                    tickLine={{
                      stroke: '#334455',
                    }}
                    axisLine={{ stroke: '#334455' }}
                  />
                  <Tooltip
                    content={<CustomTooltip symbol={baseCurrencySymbol} />}
                    isAnimationActive={false}
                    cursor={{ stroke: '#445566' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Fade>
          )}

          {chartType === 'candle' && checkValidCandleWidth(period, candleWidth) && (
            <Fade
              in={chartType === 'candle' && checkValidCandleWidth(period, candleWidth)}
              transition={{ exit: { delay: 1 }, enter: { duration: 0.5 } }}>
              <TradingViewWidget
                data={data.merged}
                noOfPaths={data.lines}
                period={period}
                selectedCandleInterval={candleWidth}
                symbol={symbol}
                isDex={isDex}
                locking={locking}
              />
            </Fade>
          )}

          {/* <ResponsiveContainer width={'100%'} height={400}>
            <TradingViewWidget
              data={data.merged}
              noOfPaths={data.lines}
              period={period}
            />
          </ResponsiveContainer> */}

          {(isDex && chartType === 'line') ? (
            <>
              <Box sx={{ position: 'relative' }}>
                <Box
                  sx={{
                    position: 'absolute',
                    left: '0px',
                    top: '-8px',
                    fontSize: '12px',
                  }}
                  color="gray.500"
                >
                  Depth +100% (Ask)
                </Box>
                <ResponsiveContainer width={'100%'} height={100}>
                  <AreaChart
                    height={150}
                    data={data.merged}
                    margin={{
                      top: 10,
                      bottom: 10,
                    }}
                    syncId="main"
                  >
                    {Array(data.lines)
                      .fill(0)
                      .map((_, idx) => (
                        <Area
                          isAnimationActive={false}
                          key={idx}
                          type="monotone"
                          dataKey={'la' + idx}
                          strokeWidth={2}
                          stroke={dexColors[idx]}
                          stackId="1"
                          fill={dexColors[idx]}
                          activeDot={activeDotStyle}
                        // dot={false}
                        />
                      ))}

                    <YAxis
                      orientation="right"
                      dx={5}
                      stroke="#8893a8"
                      domain={['auto', 'auto']}
                      axisLine={false}
                      tickLine={{
                        stroke: '#334455',
                      }}
                      tick={{ fontSize: '12px' }}
                      tickFormatter={bigTickFormatter}
                      reversed={true}
                    />
                    {/* <XAxis
                      hide={true}
                      domain={['auto', 'auto']}
                      type="number"
                      dataKey="t"
                      scale="time"
                      dy={15}
                      tickFormatter={t =>
                        period <= 24
                          ? moment.unix(t).format('HH:mm')
                          : moment.unix(t).format('Do')
                      }
                      interval={
                        period < 24
                          ? 30
                          : period < 24 * 5
                          ? 30
                          : period < 24 * 30
                          ? 30
                          : 30
                      }
                      tick={{ fill: '#8893a8' }}
                      axisLine={false}
                      tickLine={false}
                    /> */}
                    <Tooltip
                      content={() => null}
                      isAnimationActive={false}
                      cursor={{ stroke: '#445566' }}
                    />
                    {/* </LineChart> */}
                  </AreaChart>
                </ResponsiveContainer>
              </Box>

              <Box sx={{ position: 'relative' }}>
                <Box
                  sx={{
                    position: 'absolute',
                    left: '0px',
                    top: '-8px',
                    fontSize: '12px',
                  }}
                  color="gray.500"
                >
                  Depth -50% (Bid)
                </Box>
                <ResponsiveContainer width={'100%'} height={100}>
                  <AreaChart
                    height={150}
                    data={data.merged}
                    margin={{
                      top: 10,
                      bottom: 10,
                    }}
                    syncId="main"
                  >
                    {Array(data.lines)
                      .fill(0)
                      .map((_, idx) => (
                        <Area
                          isAnimationActive={false}
                          key={idx}
                          type="monotone"
                          dataKey={'l' + idx}
                          strokeWidth={2}
                          stroke={dexColors[idx]}
                          stackId="1"
                          fill={dexColors[idx]}
                          activeDot={activeDotStyle}
                        // dot={false}
                        />
                      ))}

                    <YAxis
                      // reversed={true}
                      orientation="right"
                      dx={5}
                      stroke="#8893a8"
                      domain={['auto', 'auto']}
                      axisLine={false}
                      tickLine={{
                        stroke: '#334455',
                      }}
                      tick={{ fontSize: '12px' }}
                      tickFormatter={bigTickFormatter}
                    />
                    {/* <XAxis
                      hide={true}
                      domain={['auto', 'auto']}
                      type="number"
                      dataKey="t"
                      scale="time"
                      dy={15}
                      tickFormatter={t =>
                        period <= 24
                          ? moment.unix(t).format('HH:mm')
                          : moment.unix(t).format('Do')
                      }
                      interval={
                        period < 24
                          ? 30
                          : period < 24 * 5
                          ? 30
                          : period < 24 * 30
                          ? 30
                          : 30
                      }
                      tick={{ fill: '#8893a8' }}
                      axisLine={false}
                      tickLine={false}
                    /> */}
                    <Tooltip
                      content={() => null}
                      isAnimationActive={false}
                      cursor={{ stroke: '#445566' }}
                    />
                    {/* </LineChart> */}
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            </>
          ) : null}
          {chartType == 'line' &&
            <Box sx={{ position: 'relative' }}>
              <Box
                sx={{
                  position: 'absolute',
                  left: '0px',
                  top: '-8px',
                  fontSize: '12px',
                }}
                color="gray.500"
              >
                Volume24h
              </Box>
              <ResponsiveContainer width={'100%'} height={150}>
                <AreaChart
                  height={150}
                  data={data.merged}
                  margin={{
                    top: 10,
                    bottom: 10,
                  }}
                  syncId="main"
                >
                  {Array(data.lines)
                    .fill(0)
                    .map((_, idx) => (
                      <Area
                        isAnimationActive={false}
                        key={'xq' + idx}
                        type="monotone"
                        dataKey={'v' + idx}
                        strokeWidth={0}
                        stroke={dexColors[idx]}
                        stackId="1"
                        fill={dexColors[idx]}
                        activeDot={activeDotStyle}
                      // dot={false}
                      />
                    ))}

                  <YAxis
                    orientation="right"
                    dx={5}
                    stroke="#8893a8"
                    domain={['auto', 'auto']}
                    axisLine={false}
                    tickLine={{
                      stroke: '#334455',
                    }}
                    tick={{ fontSize: '12px' }}
                    tickLineColor="#8893a8"
                    tickFormatter={bigTickFormatter}
                  ></YAxis>
                  {/* <XAxis
                    hide={true}
                    domain={['auto', 'auto']}
                    type="number"
                    dataKey="t"
                    scale="time"
                    dy={15}
                    tickFormatter={t =>
                      period <= 24
                        ? moment.unix(t).format('HH:mm')
                        : moment.unix(t).format('Do')
                    }
                    interval={
                      period < 24
                        ? 30
                        : period < 24 * 5
                        ? 30
                        : period < 24 * 30
                        ? 30
                        : 30
                    }
                    tick={{ fill: '#8893a8' }}
                    axisLine={false}
                    tickLine={false}
                  ></XAxis> */}
                  <Tooltip
                    content={() => null}
                    isAnimationActive={false}
                    cursor={{ stroke: '#445566' }}
                  />
                  {/* </LineChart> */}
                </AreaChart>
              </ResponsiveContainer>
            </Box>}
          {isDex ? (
            <>
              {locking ? (
                <>
                  {chartType == 'line' &&
                    <>
                      <Box sx={{ position: 'relative' }}>
                        <Box
                          sx={{
                            position: 'absolute',
                            left: '0px',
                            top: '-8px',
                            fontSize: '12px',
                          }}
                          color="gray.500"
                        >
                          Treasury {symbol} movement
                        </Box>
                        <ResponsiveContainer width={'100%'} height={50}>
                          <LineChart
                            height={50}
                            data={data.merged}
                            margin={{
                              top: 10,
                              bottom: 10,
                            }}
                            syncId="main"
                          >
                            <Line
                              isAnimationActive={false}
                              key={'tt'}
                              type="monotone"
                              dataKey={'tt'}
                              strokeWidth={1}
                              stroke={'#446600'}
                              stackId="1"
                              fill={'transparent'}
                              dot={false}
                              activeDot={activeDotStyle}
                            />

                            <YAxis
                              orientation="right"
                              dx={5}
                              stroke="#8893a8"
                              domain={['auto', 'auto']}
                              axisLine={false}
                              tickLine={{
                                stroke: '#334455',
                              }}
                              tick={{ fontSize: '12px' }}
                              tickLineColor="#8893a8"
                              tickFormatter={bigTickFormatter}
                            ></YAxis>
                            {/* <XAxis
                      hide={true}
                      domain={['auto', 'auto']}
                      type="number"
                      dataKey="t"
                      scale="time"
                      dy={15}
                      tickFormatter={t =>
                        period <= 24
                          ? moment.unix(t).format('HH:mm')
                          : moment.unix(t).format('Do')
                      }
                      interval={
                        period < 24
                          ? 30
                          : period < 24 * 5
                          ? 30
                          : period < 24 * 30
                          ? 30
                          : 30
                      }
                      tick={{ fill: '#8893a8' }}
                      axisLine={false}
                      tickLine={false}
                    ></XAxis> */}
                            <Tooltip
                              content={() => null}
                              isAnimationActive={false}
                              cursor={{ stroke: '#445566' }}
                            />
                            {/* </LineChart> */}
                          </LineChart>
                        </ResponsiveContainer>
                      </Box>

                      <Box sx={{ position: 'relative' }}>
                        <Box
                          sx={{
                            position: 'absolute',
                            left: '0px',
                            top: '-8px',
                            fontSize: '12px',
                          }}
                          color="gray.500"
                        >
                          Treasury ICP movement
                        </Box>
                        <ResponsiveContainer width={'100%'} height={50}>
                          <LineChart
                            height={50}
                            data={data.merged}
                            margin={{
                              top: 10,
                              bottom: 10,
                            }}
                            syncId="main"
                          >
                            <Line
                              isAnimationActive={false}
                              key={'ticp'}
                              type="line  "
                              dataKey={'ticp'}
                              strokeWidth={1}
                              stroke={'#446600'}
                              stackId="1"
                              fill={''}
                              dot={false}
                              activeDot={activeDotStyle}
                            />

                            <YAxis
                              orientation="right"
                              dx={5}
                              stroke="#8893a8"
                              domain={['auto', 'auto']}
                              axisLine={false}
                              tickLine={{
                                stroke: '#334455',
                              }}
                              tick={{ fontSize: '12px' }}
                              tickLineColor="#8893a8"
                              tickFormatter={bigTickFormatter}
                            ></YAxis>
                            {/* <XAxis
                      hide={true}
                      domain={['auto', 'auto']}
                      type="number"
                      dataKey="t"
                      scale="time"
                      dy={15}
                      interval={
                        period < 24
                          ? 30
                          : period < 24 * 5
                          ? 30
                          : period < 24 * 30
                          ? 30
                          : 30
                      }
                      tick={{ fill: '#8893a8' }}
                      axisLine={false}
                      tickLine={false}
                    ></XAxis> */}
                            <Tooltip
                              content={() => null}
                              isAnimationActive={false}
                              cursor={{ stroke: '#445566' }}
                            />
                            {/* </LineChart> */}
                          </LineChart>
                        </ResponsiveContainer>
                      </Box>

                      <Box sx={{ position: 'relative' }} mt="2">
                        <Box
                          sx={{
                            position: 'absolute',
                            left: '0px',
                            top: '-8px',
                            fontSize: '12px',
                          }}
                          color="gray.500"
                        >
                          Total locked movement
                        </Box>
                        <ResponsiveContainer width={'100%'} height={50}>
                          <AreaChart
                            height={50}
                            data={data.merged}
                            margin={{
                              top: 10,
                              bottom: 10,
                            }}
                            syncId="main"
                          >
                            <Area
                              isAnimationActive={false}
                              key={'cs'}
                              type="monotone"
                              dataKey={'cs'}
                              strokeWidth={2}
                              stroke={'#445566'}
                              stackId="1"
                              fill={'#445566'}
                              activeDot={activeDotStyle}
                            // dot={false}
                            />

                            <YAxis
                              orientation="right"
                              dx={5}
                              stroke="#8893a8"
                              domain={['auto', 'auto']}
                              axisLine={false}
                              tickLine={{
                                stroke: '#334455',
                              }}
                              tick={{ fontSize: '12px' }}
                              tickFormatter={bigTickFormatter}
                            />
                            {/* <XAxis
                  hide={true}
                  domain={['auto', 'auto']}
                  type="number"
                  dataKey="t"
                  scale="time"
                  dy={15}
                  dx={16}
                  tickFormatter={t =>
                    period <= 24
                      ? moment.unix(t).format('HH:mm')
                      : moment.unix(t).format('Do')
                  }
                  interval={60}
                  tick={{ fill: '#8893a8' }}
                  axisLine={false}
                  tickLine={{
                    stroke: '#334455',
                  }}
                /> */}
                            <Tooltip
                              content={() => null}
                              isAnimationActive={false}
                              cursor={{ stroke: '#445566' }}
                            />
                            {/* </LineChart> */}
                          </AreaChart>
                        </ResponsiveContainer>
                      </Box>
                    </>
                  }

                  <Box sx={{ position: 'relative' }} mt="5">
                    <Box
                      sx={{
                        position: 'absolute',
                        left: '0px',
                        top: '-8px',
                        fontSize: '12px',
                      }}
                      color="gray.500"
                    >
                      Neurons non dissolving
                    </Box>
                    <ResponsiveContainer width={'100%'} height={75}>
                      <AreaChart
                        height={75}
                        data={data.neurons}
                        margin={{
                          top: 10,
                          bottom: 10,
                        }}
                        syncId={'neurons'}
                      >
                        <Area
                          isAnimationActive={false}
                          key={'nds'}
                          type="monotone"
                          dataKey={'nds'}
                          strokeWidth={2}
                          stroke={'#445566'}
                          stackId="1"
                          fill={'#445566'}
                          activeDot={activeDotStyle}
                        />

                        <YAxis
                          orientation="right"
                          dx={5}
                          stroke="#8893a8"
                          domain={['auto', 'auto']}
                          axisLine={false}
                          tickLine={{
                            stroke: '#334455',
                          }}
                          tick={{ fontSize: '12px' }}
                          tickFormatter={bigTickFormatter}
                        />

                        {/* <Tooltip /> */}
                        {/* </LineChart> */}
                      </AreaChart>
                    </ResponsiveContainer>
                  </Box>
                  <Box sx={{ position: 'relative' }} mt="5">
                    <Box
                      sx={{
                        position: 'absolute',
                        left: '0px',
                        top: '-8px',
                        fontSize: '12px',
                      }}
                      color="gray.500"
                    >
                      Neurons dissolving
                    </Box>
                    <ResponsiveContainer width={'100%'} height={100}>
                      <AreaChart
                        height={100}
                        data={data.neurons}
                        margin={{
                          top: 10,
                          bottom: 10,
                        }}
                        syncId={'neurons'}
                      >
                        <Area
                          isAnimationActive={false}
                          key={'ds'}
                          type="monotone"
                          dataKey={'ds'}
                          strokeWidth={2}
                          stroke={'#FF7171'}
                          stackId="1"
                          fill={'#FF717177'}
                          activeDot={activeDotStyle}
                        />

                        <YAxis
                          orientation="right"
                          dx={5}
                          stroke="#8893a8"
                          domain={['auto', 'auto']}
                          axisLine={false}
                          tickLine={{
                            stroke: '#334455',
                          }}
                          tick={{ fontSize: '12px' }}
                          tickFormatter={bigTickFormatter}
                          reversed={true}
                        />
                        <XAxis
                          hide={false}
                          domain={['auto', 'auto']}
                          type="number"
                          dataKey="t"
                          scale="time"
                          dy={15}
                          dx={25}
                          tickFormatter={t =>
                            '+' +
                            Math.round(
                              (t - Date.now() / 1000) / (60 * 60 * 24 * 30)
                            ) +
                            ' mo'
                          }
                          interval={isLarge ? 30 : 70}
                          tick={{ fill: '#8893a8' }}
                          axisLine={false}
                          tickLine={{
                            stroke: '#334455',
                          }}
                        />
                        {/* <Tooltip /> */}
                        {/* </LineChart> */}
                      </AreaChart>
                    </ResponsiveContainer>
                  </Box>
                </>
              ) : null}
            </>
          ) : null}
          </Box>

        </Box>
      </Box>
      {data?.sources?.length ? (
        <Box mt="15px" pb="15px" pt="15px" ml="-15px" mr="-15px" bg={bg2}>
          <Box maxW="1278px" m="auto">
            <TableContainer css={tableCss}>
              <Table variant="simple" fontSize="14px" size="sm">
                <Thead>
                  <Tr>
                    <Th>Source</Th>
                    <Th>Note</Th>
                    <Th isNumeric>Price</Th>
                    <Th isNumeric>24H Volume</Th>
                    <Th isNumeric>7D Volume</Th>
                    <Th isNumeric>30D Volume</Th>
                    <Th isNumeric>Depth -50%</Th>
                    <Th isNumeric>Depth +100%</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {data.sources.map((data, idx) => (
                    <Source key={idx} idx={idx} data={data} />
                  ))}
                </Tbody>
              </Table>
            </TableContainer>
          </Box>
        </Box>
      ) : null}
    </>
  );
};

const Source = ({ data, idx }) => {
  if (!data.price) return null;
  return (
    <Tr>
      <Td>
        {data.source.url ? (
          <Link href={data.source.url} target="_blank" color={dexColors[idx]}>
            {data.source.name} <ExternalLinkIcon />
          </Link>
        ) : (
          <>{data.source.name}</>
        )}
      </Td>
      <Td>
        {data.source.tip ? (
          <Tip label={data.source.tip}>
            <InfoIcon color={'blue.500'} />
          </Tip>
        ) : null}
      </Td>
      <Td isNumeric>{smartNumber(data.price)}</Td>
      <Td isNumeric>
        {data.volume24 === 0 ? '-' : smartNumber(data.volume24)}
      </Td>
      <Td isNumeric>{data.volume7 === 0 ? '-' : smartNumber(data.volume7)}</Td>
      <Td isNumeric>
        {data.volume30 === 0 ? '-' : smartNumber(data.volume30)}
      </Td>

      <Td isNumeric>
        {data.liquidity ? <>{smartNumber(data.liquidity)}</> : <>-</>}
      </Td>
      <Td isNumeric>
        {data.liqask ? <>{smartNumber(data.liqask)}</> : <>-</>}
      </Td>
    </Tr>
  );
};

const CustomTooltip = ({ symbol, active, payload, label }) => {
  let avg_price = payload.reduce((a, b) => a + b.value, 0) / payload.length;
  if (active && payload && payload.length) {
    return (
      <div className="ctip">
        <p className="mdy">{moment.unix(label).format('MMMM Do YYYY')}</p>
        <p className="hmm">{moment.unix(label).format('HH:mm')}</p>
        <p className="chpr">
          {smartNumber(avg_price)} {symbol}
        </p>
      </div>
    );
  }

  return null;
};

const daysFromStart = () => {
  return Math.floor((Date.now() / 1000 - first_tick) / (60 * 60 * 24));
};
