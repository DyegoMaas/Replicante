FROM node

WORKDIR /test

RUN wget https://github.com/DyegoMaas/replicante-test-example/archive/master.tar.gz
RUN tar -xf ./master.tar.gz
RUN ls -lha .

RUN npm install -g replicante
RUN replicante create ./replicante-test-example-master/TestSample/hello-world \
      ./replicante-test-example-master/TestSample/helloworld-to-hithere-recipe.json \
      --target=./replicante-test-example-master/TestSample/Target
RUN ls -lha ./replicante-test-example-master/TestSample/Target

CMD ["echo", "\"ok\""]