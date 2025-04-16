import pandas as pd

df = pd.read_csv('olympics_dataset (1).csv') # load the data
print(df.head())

# check column names match
df = df[['Year', 'Team', 'Medal']]
df = df.dropna(subset=['Medal']) # drops the rows w/ out a medal
df = df[df['Year'] >= 2012] # filter data for the last decade (i.e., only 2012 and later)

# converts the Medals to points
medal_points = {'Gold': 3, 'Silver': 2, 'Bronze': 1}
df['Points'] = df['Medal'].map(medal_points)

# group by year and country, sum points
grouped = df.groupby(['Year', 'Team'])['Points'].sum().reset_index()
grouped = grouped.rename(columns={'Team': 'Country', 'Points': 'TotalPoints'})
grouped['Rank'] = grouped.groupby('Year')['TotalPoints'].rank(method='dense', ascending=False).astype(int) # rank the countries by points

grouped = grouped.sort_values(['Year', 'Rank']) # sort by year and rank

grouped.to_csv('bump_data_decade.csv', index=False)
print("csv file created")
print(grouped.head())
