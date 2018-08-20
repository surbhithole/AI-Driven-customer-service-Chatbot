import requests
import csv
import json

reader = csv.reader(open("new_output1.csv", "rb"))

for row in reader:
	restoData = {"bestAnswer" : row[0], "Score" : row[1], "Cuisine" : row[2], "RestaurantID" : row[3]}

	print restoData
	
	#print row

	req = requests.post("https://search-assignment3-es-qwxifld3qudrzq4qslz3qonaui.us-east-1.es.amazonaws.com/predictions/Prediction", data=json.dumps({"bestAnswer" : row[0], "Score" : row[1], "Cuisine" : row[2], "RestaurantID" : row[3]}), headers={'content-type' : 'application/json'})

	print req.status_code, " ", req.reason
