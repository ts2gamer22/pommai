Learn how to query data from Convex in a Python app.

Create a Python script folder
Create a folder for your Python script with a virtual environment.

python3 -m venv my-app/venv

Install the Convex client and server libraries
To get started, install the convex npm package which enables you to write your backend.

And also install the convex Python client library and python-dotenv for working with .env files.

cd my-app && npm init -y && npm install convex && venv/bin/pip install convex python-dotenv


Set up a Convex dev deployment
Next, run npx convex dev. This will prompt you to log in with GitHub, create a project, and save your production and deployment URLs.

It will also create a convex/ folder for you to write your backend API functions in. The dev command will then continue running to sync your functions with your dev deployment in the cloud.

npx convex dev

Create sample data for your database
In a new terminal window, create a sampleData.jsonl file with some sample data.

sampleData.jsonl
{"text": "Buy groceries", "isCompleted": true}
{"text": "Go for a swim", "isCompleted": true}
{"text": "Integrate Convex", "isCompleted": false}

Add the sample data to your database
Now that your project is ready, add a tasks table with the sample data into your Convex database with the import command.

npx convex import --table tasks sampleData.jsonl

Expose a database query
Add a new file tasks.js in the convex/ folder with a query function that loads the data.

Exporting a query function from this file declares an API function named after the file and the export name, "tasks:get".

convex/tasks.js
import { query } from "./_generated/server";

export const get = query({
  handler: async ({ db }) => {
    return await db.query("tasks").collect();
  },
});

Create a script to load data from Convex
In a new file main.py, create a ConvexClient and use it to fetch from your "tasks:get" API.

main.py
import os

from dotenv import load_dotenv

from convex import ConvexClient

load_dotenv(".env.local")
CONVEX_URL = os.getenv("CONVEX_URL")
# or you can hardcode your deployment URL instead
# CONVEX_URL = "https://happy-otter-123.convex.cloud"

client = ConvexClient(CONVEX_URL)

print(client.query("tasks:get"))

for tasks in client.subscribe("tasks:get"):
    print(tasks)
    # this loop lasts forever, ctrl-c to exit it

Run the script
Run the script and see the serialized list of tasks.

venv/bin/python -m main


GITHUB REPO: https://github.com/get-convex/convex-py

MORE DOCS:

Project description
Convex
The official Python client for Convex.

PyPI GitHub

Write and read data from a Convex backend with queries, mutations, and actions. Get up and running at docs.convex.dev.

Installation:

pip install convex
Basic usage:

>>> from convex import ConvexClient
>>> client = ConvexClient('https://example-lion-123.convex.cloud')
>>> messages = client.query("messages:list")
>>> from pprint import pprint
>>> pprint(messages)
[{'_creationTime': 1668107495676.2854,
  '_id': '2sh2c7pn6nyvkexbdsfj66vd9h5q3hg',
  'author': 'Tom',
  'body': 'Have you tried Convex?'},
 {'_creationTime': 1668107497732.2295,
  '_id': '1f053fgh2tt2fc93mw3sn2x09h5bj08',
  'author': 'Sarah',
  'body': "Yeah, it's working pretty well for me."}]
>>> client.mutation("messages:send", dict(author="Me", body="Hello!"))
>>> for mesages client.subscribe("messages:list", {}):
...     print(len(messages))
...
3
<this for loop lasts until you break out with ctrl-c>
To find the url of your convex backend, open the deployment you want to work with in the appropriate project in the Convex dashboard and click "Settings" where the Deployment URL should be visible. To find out which queries, mutations, and actions are available check the Functions pane in the dashboard.

To see logs emitted from Convex functions, set the debug mode to True.

>>> client.set_debug(True)
To provide authentication for function execution, call set_auth().

>>> client.set_auth("token-from-authetication-flow")
Join us on Discord to get your questions answered or share what you're doing with Convex. If you're just getting started, see https://docs.convex.dev to see how to quickly spin up a backend that does everything you need in the Convex cloud.

Convex types
Convex backend functions are written in JavaScript, so arguments passed to Convex RPC functions in Python are serialized, sent over the network, and deserialized into JavaScript objects. To learn about Convex's supported types see https://docs.convex.dev/using/types.

In order to call a function that expects a JavaScript type, use the corresponding Python type or any other type that coerces to it. Values returned from Convex will be of the corresponding Python type.

JavaScript Type	Python Type	Example	Other Python Types that Convert
null	None	None	
bigint	ConvexInt64 (see below)	ConvexInt64(2**60)	
number	float or int	3.1, 10	
boolean	bool	True, False	
string	str	'abc'	
ArrayBuffer	bytes	b'abc'	ArrayBuffer
Array	list	[1, 3.2, "abc"]	tuple, collections.abc.Sequence
object	dict	{a: "abc"}	collections.abc.Mapping
Ints and Floats
While Convex supports storing Int64s and Float64s, idiomatic JavaScript pervasively uses the (floating point) Number type. In Python floats are often understood to contain the ints: the float type annotation is generally understood as Union[int, float].

Therefore, the Python Convex client converts Python's floats and ints to a Float64 in Convex.

To specify a JavaScript BigInt, use the ConvexInt64 class. Functions which return JavaScript BigInts will return ConvexInt64 instances.

Convex Errors
The Python client supports the ConvexError type to hold application errors that are propagated from your Convex functions. To learn about how to throw ConvexErrors see https://docs.convex.dev/functions/error-handling/application-errors.

On the Python client, ConvexErrors are Exceptions with a data field that contains some ConvexValue. Handling application errors from the Python client might look something like this:

import convex
client = convex.ConvexClient('https://happy-animal-123.convex.cloud')

try:
    client.mutation("messages:sendMessage", {body: "hi", author: "anjan"})
except convex.ConvexError as err:
    if isinstance(err.data, dict):
        if "code" in err.data and err.data["code"] == 1:
            # do something
        else:
            # do something else
    elif isinstance(err.data, str):
        print(err.data)
except Exception as err:
    # log internally
Pagination
Paginated queries are queries that accept pagination options as an argument and can be called repeatedly to produce additional "pages" of results.

For a paginated query like this:

import { query } from "./_generated/server";

export default query(async ({ db }, { paginationOpts }) => {
  return await db.query("messages").order("desc").paginate(paginationOpts);
});
and returning all results 5 at a time in Python looks like this:

import convex
client = convex.ConvexClient('https://happy-animal-123.convex.cloud')

done = False
cursor = None
data = []

while not done:
    result = client.query('listMessages', {"paginationOpts": {"numItems": 5, "cursor": cursor}})
    cursor = result['continueCursor']
    done = result["isDone"]
    data.extend(result['page'])
    print('got', len(result['page']), 'results')

print('collected', len(data), 'results')
Versioning
While we are pre-1.0.0, we'll update the minor version for large changes, and the patch version for small bugfixes. We may make backwards incompatible changes to the python client's API, but we will limit those to minor version bumps.