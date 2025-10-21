/** @type {import('twrnc').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: '#2E523A',    // main green
        secondary: '#F2F1EB',  // off white
        white: '#FFFFFF',      // white langg
        'green-light': 'rgba(175,200,173,0.61)',
        'text-gray': '#6C8770',
        sibolGreen: '#2E523A',
        //pedi add ng ibang colors here
      },
      fontFamily: {
        inter: 'Inter',
        'instrument-sans': 'InstrumentSans',
      },
      spacing: {
        '1px': '1px',
        '2px': '2px',
        '3px': '3px',
      },
      screens: {
        sm: '0px',
        md: '768px',
        lg: '1024px',
      },
      maxWidth: {
        'screen-sm': '640px',
        'screen-md': '768px',
        'screen-lg': '1024px',
      },
    },
  },
}