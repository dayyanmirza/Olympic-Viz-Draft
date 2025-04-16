# Olympic Team Performance Bump Chart Visualisation

This project is a data visualisation of Olympic data using D3.js. The visualisation loads data from a CSV file and is displayed in the browser.

## How to Run

To view the visualisation:

1. Ensure you have the following files in the project directory:
    - `bump_data_decade.csv` (processed data file)
    - `index.html` (HTML file for the visualisation)
    - `script.js` (JavaScript file for the visualisation logic)

2. Open the `index.html` file using a local web server. This is necessary to avoid browser security restrictions on `file://` paths. For example:
    - Use the "Live Server" extension in your IDE.

## Data Preprocessing

The `bump_data_decade.csv` file is the preprocessed data used in the visualization. If you want to preprocess the data yourself, the following files are included:

- `preprocess.py`: A Python script that shows how the data was preprocessed.
- `olympics_dataset (1).csv`: The original dataset used for preprocessing.

You can run `preprocess.py` to generate the `bump_data_decade.csv` file. Make sure you have Python installed along with the required libraries (e.g., pandas).

## Notes

- This visualisation uses D3.js for rendering.
- Ensure all required files are in the same directory for the project to work correctly.