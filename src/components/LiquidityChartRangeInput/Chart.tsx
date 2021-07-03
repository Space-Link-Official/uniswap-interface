import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { scaleLinear, max, format, ZoomTransform } from 'd3'
import { AxisBottom } from './AxisBottom'
import { Line } from './Line'
import { Area } from './Area'
import { Bars } from './Bars'
import { Brush } from './Brush'
import { LiquidityChartRangeInputProps, ChartEntry } from './types'
import Zoom from './Zoom'

export const xAccessor = (d: ChartEntry) => d.price0
export const yAccessor = (d: ChartEntry) => d.activeLiquidity

export function Chart({
  id = 'liquidityChartRangeInput',
  data: { series, current },
  styles,
  dimensions: { width, height },
  margins,
  interactive = true,
  brushDomain,
  onBrushDomainChange,
}: LiquidityChartRangeInputProps) {
  const svgRef = useRef<SVGSVGElement | null>(null)

  const [zoom, setZoom] = useState<ZoomTransform>()

  const [innerHeight, innerWidth] = useMemo(
    () => [height - margins.top - margins.bottom, width - margins.left - margins.right],
    [width, height, margins]
  )

  const { xScale, yScale } = useMemo(() => {
    const scales = {
      xScale: scaleLinear()
        .domain([0.7 * current, 1.3 * current] as number[])
        .range([0, innerWidth]),
      yScale: scaleLinear()
        .domain([0, max(series, yAccessor)] as number[])
        .range([innerHeight, 0]),
    }

    if (zoom) {
      const newXscale = zoom.rescaleX(scales.xScale)
      scales.xScale.domain(newXscale.domain())
    }

    return scales
  }, [current, innerWidth, series, innerHeight, zoom])

  const brushLabelValue = useCallback(
    (x: number) => {
      const percent =
        (((x < current ? -1 : 1) * (Math.max(x, current) - Math.min(x, current))) / Math.min(x, current)) * 100

      return current ? `${format(Math.abs(percent) > 1 ? '.2~s' : '.2~f')(percent)}%` : ''
    },
    [current]
  )

  useEffect(() => {
    if (!brushDomain) {
      onBrushDomainChange(xScale.domain() as [number, number])
    }
  }, [brushDomain, onBrushDomainChange, xScale])

  return (
    <>
      <Zoom svg={svgRef.current} xScale={xScale} setZoom={setZoom} innerWidth={innerWidth} innerHeight={innerHeight} />
      <svg ref={svgRef} style={{ overflow: 'visible' }} width={width} height={height}>
        <defs>
          <clipPath id={`${id}-chart-clip`}>
            <rect x="0" y="0" width={innerWidth} height={height} />
          </clipPath>
        </defs>

        <g transform={`translate(${margins.left},${margins.top})`}>
          <g clipPath={`url(#${id}-chart-clip)`}>
            {/* {<Area series={series} xScale={xScale} yScale={yScale} xValue={xAccessor} yValue={yAccessor} />} */}
            <Bars
              series={series}
              xScale={xScale}
              yScale={yScale}
              xValue={xAccessor}
              yValue={yAccessor}
              innerWidth={innerWidth}
              innerHeight={innerHeight}
            />

            <Line value={current} xScale={xScale} innerHeight={innerHeight} />

            <AxisBottom xScale={xScale} innerHeight={innerHeight} />
          </g>

          <Brush
            id={id}
            xScale={xScale}
            interactive={interactive}
            brushLabelValue={brushLabelValue}
            brushExtent={brushDomain ?? (xScale.domain() as [number, number])}
            innerWidth={innerWidth}
            innerHeight={innerHeight}
            setBrushExtent={onBrushDomainChange}
            colors={{
              west: styles.brush.handle.west,
              east: styles.brush.handle.east,
            }}
          />
        </g>
      </svg>
    </>
  )
}
