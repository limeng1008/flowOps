/**
 * Color intention that you want to used in your theme
 * @param {JsonObject} theme Theme customization object
 */

export default function themePalette(theme) {
    return {
        mode: theme?.customization?.navType,
        transparent: theme.colors?.transparent,
        common: {
            black: theme.colors?.darkPaper,
            dark: theme.colors?.darkPrimaryMain
        },
        primary: {
            light: theme.customization.isDarkMode ? theme.colors?.darkPrimaryLight : theme.colors?.primaryLight,
            main: theme.colors?.primaryMain,
            dark: theme.customization.isDarkMode ? theme.colors?.darkPrimaryDark : theme.colors?.primaryDark,
            200: theme.customization.isDarkMode ? theme.colors?.darkPrimary200 : theme.colors?.primary200,
            800: theme.customization.isDarkMode ? theme.colors?.darkPrimary800 : theme.colors?.primary800
        },
        secondary: {
            light: theme.customization.isDarkMode ? theme.colors?.darkSecondaryLight : theme.colors?.secondaryLight,
            main: theme.customization.isDarkMode ? theme.colors?.darkSecondaryMain : theme.colors?.secondaryMain,
            dark: theme.customization.isDarkMode ? theme.colors?.darkSecondaryDark : theme.colors?.secondaryDark,
            200: theme.colors?.secondary200,
            800: theme.colors?.secondary800
        },
        error: {
            light: theme.colors?.errorLight,
            main: theme.colors?.errorMain,
            dark: theme.colors?.errorDark
        },
        orange: {
            light: theme.colors?.orangeLight,
            main: theme.colors?.orangeMain,
            dark: theme.colors?.orangeDark
        },
        teal: {
            light: theme.colors?.tealLight,
            main: theme.colors?.tealMain,
            dark: theme.colors?.tealDark
        },
        warning: {
            light: theme.colors?.warningLight,
            main: theme.colors?.warningMain,
            dark: theme.colors?.warningDark
        },
        success: {
            light: theme.colors?.successLight,
            200: theme.colors?.success200,
            main: theme.colors?.successMain,
            dark: theme.colors?.successDark
        },
        grey: {
            50: theme.colors?.grey50,
            100: theme.colors?.grey100,
            200: theme.colors?.grey200,
            300: theme.colors?.grey300,
            500: theme.darkTextSecondary,
            600: theme.heading,
            700: theme.darkTextPrimary,
            900: theme.textDark
        },
        dark: {
            light: theme.colors?.darkTextPrimary,
            main: theme.colors?.darkLevel1,
            dark: theme.colors?.darkLevel2,
            800: theme.colors?.darkBackground,
            900: theme.colors?.darkPaper
        },
        text: {
            primary: theme.darkTextPrimary,
            secondary: theme.darkTextSecondary,
            dark: theme.textDark,
            hint: theme.colors?.grey100
        },
        background: {
            paper: theme.paper,
            default: theme.backgroundDefault
        },
        glass: {
            surface: theme.customization.isDarkMode ? theme.colors?.glassDarkSurface : theme.colors?.glassLightSurface,
            surfaceStrong: theme.customization.isDarkMode ? theme.colors?.glassDarkSurfaceStrong : theme.colors?.glassLightSurfaceStrong,
            border: theme.customization.isDarkMode ? theme.colors?.glassDarkBorder : theme.colors?.glassBorder,
            highlight: theme.customization.isDarkMode ? theme.colors?.glassDarkHighlight : theme.colors?.glassHighlight,
            control: theme.customization.isDarkMode ? theme.colors?.glassDarkControlSurface : theme.colors?.glassControlSurface,
            controlHover: theme.customization.isDarkMode
                ? theme.colors?.glassDarkControlSurfaceHover
                : theme.colors?.glassControlSurfaceHover,
            controlActive: theme.customization.isDarkMode
                ? theme.colors?.glassDarkControlSurfaceActive
                : theme.colors?.glassControlSurfaceActive,
            accent: theme.colors?.glassAccent,
            accentAlt: theme.colors?.glassAccentAlt,
            accentSoft: theme.colors?.glassAccentSoft,
            accentStrong: theme.colors?.glassAccentStrong,
            accentText: theme.customization.isDarkMode ? theme.colors?.glassDarkAccentText : theme.colors?.glassAccentText,
            shadow: theme.customization.isDarkMode ? theme.colors?.glassShadowDark : theme.colors?.glassShadowLight,
            controlShadow: theme.customization.isDarkMode ? theme.colors?.glassControlShadowDark : theme.colors?.glassControlShadowLight,
            blur: theme.colors?.glassBlur
        },
        textBackground: {
            main: theme.customization.isDarkMode ? theme.colors?.darkPrimary800 : theme.colors?.grey50,
            border: theme.customization.isDarkMode ? theme.colors?.transparent : theme.colors?.grey400
        },
        card: {
            main: theme.customization.isDarkMode ? theme.colors?.glassDarkSurface : theme.colors?.glassLightSurface,
            light: theme.customization.isDarkMode ? theme.colors?.glassDarkSurfaceStrong : theme.colors?.glassLightSurfaceStrong,
            hover: theme.customization.isDarkMode ? theme.colors?.glassDarkSurfaceStrong : theme.colors?.glassLightSurfaceStrong
        },
        asyncSelect: {
            main: theme.customization.isDarkMode ? theme.colors?.glassDarkSurface : theme.colors?.glassLightSurface
        },
        timeMessage: {
            main: theme.customization.isDarkMode ? theme.colors?.darkLevel2 : theme.colors?.grey200
        },
        canvasHeader: {
            deployLight: theme.colors?.primaryLight,
            deployDark: theme.colors?.primaryDark,
            saveLight: theme.colors?.secondaryLight,
            saveDark: theme.colors?.secondaryDark,
            settingsLight: theme.colors?.grey300,
            settingsDark: theme.colors?.grey700
        },
        codeEditor: {
            main: theme.customization.isDarkMode ? theme.colors?.darkPrimary800 : theme.colors?.primaryLight
        },
        nodeToolTip: {
            background: theme.customization.isDarkMode ? theme.colors?.darkPrimary800 : theme.colors?.paper,
            color: theme.customization.isDarkMode ? theme.colors?.paper : 'rgba(0, 0, 0, 0.87)'
        }
    }
}
