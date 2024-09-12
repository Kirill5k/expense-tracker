import { createIcon } from "@gluestack-ui/icon";
import { Path, G, Svg } from "react-native-svg";
export const BarChartIcon = createIcon({
  Root: Svg,
  viewBox: "0 0 24 24",
  path: (
      <G>
        <Path
            strokeWidth="0.3"
            fill="currentColor"
            d="M22,21H2V3H4V19H6V10H10V19H12V6H16V19H18V14H22V21Z"
        />
      </G>
  ),
});
