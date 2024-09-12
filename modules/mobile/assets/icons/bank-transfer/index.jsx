import { createIcon } from "@gluestack-ui/icon";
import { Path, Svg } from "react-native-svg";
export const BankTransferIcon = createIcon({
  Root: Svg,
  viewBox: "0 0 24 24",
  path: (
      <>
        <Path
            strokeWidth="0.3"
            fill="currentColor"
            d="M15,14V11H18V9L22,12.5L18,16V14H15M14,7.7V9H2V7.7L8,4L14,7.7M7,10H9V15H7V10M3,10H5V15H3V10M13,10V12.5L11,14.3V10H13M9.1,16L8.5,16.5L10.2,18H2V16H9.1M17,15V18H14V20L10,16.5L14,13V15H17Z"
        />
      </>
  ),
});
