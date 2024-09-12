import { createIcon } from "@gluestack-ui/icon";
import { Path, G, Svg } from "react-native-svg";

export const ShapeIcon = createIcon({
  Root: Svg,
  viewBox: "0 0 24 24",
  path: (
      <G>
        <Path
            d="M11,13.5V21.5H3V13.5H11M12,2L17.5,11H6.5L12,2M17.5,13C20,13 22,15 22,17.5C22,20 20,22 17.5,22C15,22 13,20 13,17.5C13,15 15,13 17.5,13Z"
        />
      </G>
  )
})

