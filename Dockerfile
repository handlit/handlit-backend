FROM node:18.14.0

ARG ENVIRONMENT
ENV ENVIRONMENT=${ENVIRONMENT}

WORKDIR /opt/handlit-backend-server

COPY . .

RUN ln -f -s /usr/share/zoneinfo/ROK /etc/localtime \
 && mkdir /var/log/tomcat8

RUN apt-get update -y
RUN npm install


# 환경변수 출력
RUN echo $ENVIRONMENT

# 패키지 설치
CMD if [ "$ENVIRONMENT" = "live" ] ; then yarn live ; else yarn stage ; fi
