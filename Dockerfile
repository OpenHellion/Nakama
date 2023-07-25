FROM heroiclabs/nakama-pluginbuilder:3.17.0 AS go-builder

ENV GO111MODULE on
ENV CGO_ENABLED 1

WORKDIR /backend
COPY src/go.mod .
COPY src/**/*.go .
COPY src/vendor/ vendor/

RUN go build --trimpath --mod=vendor --buildmode=plugin -o ./backend.so

FROM registry.heroiclabs.com/heroiclabs/nakama:3.17.0

COPY --from=go-builder /backend/backend.so /nakama/modules/
COPY serverWhitelist.json /nakama/data/
COPY local.yml /nakama/data/