import colors from "tailwindcss/colors";

export default {
  light: {
    error: colors.red[800],
    text: colors.gray[900], // Equivalent to text-gray-900
    background: colors.white, // Equivalent to bg-white
    tint: colors.blue[600], // Equivalent to text-blue-600
    tabIconDefault: colors.gray[500], // Equivalent to text-gray-500
    tabIconSelected: colors.blue[600], // Equivalent to text-blue-600
    progressMain: colors.blue[500],
    progressBackground: colors.blue[200],
    expense: {
      barChartMain: colors.rose[400],
      barChartSecondary: colors.rose[100],
    },
    income: {
      barChartMain: colors.blue[400],
      barChartSecondary: colors.blue[100],
    },
  },
  dark: {
    error: colors.red[200],
    text: colors.white, // Equivalent to text-white
    background: colors.black, // Equivalent to bg-gray-900
    tint: colors.blue[300], // Equivalent to text-blue-300
    tabIconDefault: colors.gray[400], // Equivalent to text-gray-400
    tabIconSelected: colors.blue[300], // Equivalent to text-blue-300
    progressMain: colors.blue[300],
    progressBackground: colors.blue[100],
    expense: {
      barChartMain: colors.rose[500],
      barChartSecondary: colors.rose[950],
    },
    income: {
      barChartMain: colors.blue[500],
      barChartSecondary: colors.blue[950],
    }
  },
};