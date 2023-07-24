export default function WeatherStatus({ message }: { message: string }) {
    return (
        <div className="flex justify-center mx-1 pb-24 lg:pb-0">
            <div className="w-full w-max-[400px]">
                <h3 className="text-2xl mt-2 mb-6 uppercase text-center lg:w-1/2 mx-auto">
                    Weather Status
                </h3>
                {message.length ? (
                    message
                        .split("\n")
                        .map((val, key) => <p key={key}>{val}</p>)
                ) : (
                    <p>No weather report</p>
                )}
            </div>
        </div>
    );
}
