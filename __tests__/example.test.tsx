import { render, screen } from '@testing-library/react-native';
import { Text } from '@/components/Text';

describe('Example', () => {
  it('renders text correctly', () => {
    render(<Text>Hello Bingkit</Text>);
    expect(screen.getByText('Hello Bingkit')).toBeTruthy();
  });
});
