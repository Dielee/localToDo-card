# set base image (host OS)
FROM python:3.8

# set the working directory in the container
WORKDIR /localToDo

# set env tag
ENV AM_I_IN_A_DOCKER_CONTAINER Yes

# copy the dependencies file to the working directory
COPY requirements.txt .

# install dependencies
RUN pip install -r requirements.txt

# copy the content of the local src directory to the working directory
COPY src/ .

# command to run on container start
CMD [ "python", "./main.py" ]
