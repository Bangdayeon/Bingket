import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { View } from 'react-native';
import { Text } from '@/components/Text';

interface DonutStatProps {
  label: string;
  current: number;
  total: number;
  size?: 'sm' | 'md';
  overflowRed?: boolean;
  centerText?: string;
  centerFontSize?: number;
}

export function DonutStat({
  label,
  current,
  total,
  size = 'md',
  overflowRed = true,
  centerText,
  centerFontSize,
}: DonutStatProps) {
  const SIZE = size === 'sm' ? 60 : 72;
  const STROKE = size === 'sm' ? 8 : 10;

  const R = (SIZE - STROKE) / 2;
  const CIRCUMFERENCE = 2 * Math.PI * R;

  const ratio = total > 0 ? Math.min(current / total, 1) : 0;
  const isOver = overflowRed && current > total;
  const filled = CIRCUMFERENCE * ratio;

  return (
    <View className="items-center gap-1">
      <Text className="text-label-sm md:text-label-md font-pretendard-medium">{label}</Text>

      <View style={{ width: SIZE, height: SIZE }}>
        <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
          <Defs>
            <LinearGradient id="donutGrad" x1="0" y1="1" x2="1" y2="0">
              <Stop offset="0" stopColor="#8EF275" />
              <Stop offset="1" stopColor="#54DBED" />
            </LinearGradient>
          </Defs>

          {/* background */}
          <Circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            fill="none"
            stroke="#E5E7EB"
            strokeWidth={STROKE}
          />

          {/* progress */}
          {filled > 0 && (
            <Circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={R}
              fill="none"
              stroke={isOver ? '#EF4444' : 'url(#donutGrad)'}
              strokeWidth={STROKE}
              strokeDasharray={`${filled} ${CIRCUMFERENCE - filled}`}
              strokeDashoffset={CIRCUMFERENCE / 4}
              strokeLinecap="round"
            />
          )}
        </Svg>

        {/* center text */}
        <View
          style={{
            position: 'absolute',
            width: SIZE,
            height: SIZE,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text
            className={size === 'sm' ? 'text-caption-sm' : 'text-body-sm'}
            style={{
              color: isOver ? '#EF4444' : undefined,
              ...(centerFontSize !== undefined ? { fontSize: centerFontSize } : {}),
            }}
          >
            {centerText ?? `${current}/${total}`}
          </Text>
        </View>
      </View>
    </View>
  );
}
