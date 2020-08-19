FROM node

WORKDIR /test

ADD https://github.com/DyegoMaas/replicante-test-example.git .

RUN npm install -g replicante
RUN replicante create ./TestSample/hello-world ./TestSample/helloworld-to-hithere-recipe.json --target=./TestSample/Target

CMD ["echo", "\"ok\""]