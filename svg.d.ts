declare module '*.svg' {
  import React from 'react';
  import { SvgProps } from 'react-native-svg';
  const content: React.ComponentClass<SvgProps>;
  export default content;
}
