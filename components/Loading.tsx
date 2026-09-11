import { ActivityIndicator } from 'react-native';

interface LoadingProps {
  className?: string;
}

export default function Loading({ className = 'text-gray-500' }: LoadingProps) {
  return <ActivityIndicator size="small" className={className} />;
}
